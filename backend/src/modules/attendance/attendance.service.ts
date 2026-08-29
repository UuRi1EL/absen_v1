import { AttendanceRepository } from './attendance.repository.js';
import { CheckInDto, CheckOutDto } from './attendance.validator.js';
import { GeoHelper } from '../../helpers/geo.helper.js';
import { prisma } from '../../config/database.config.js';
import { BadRequestError } from '../../errors/app-error.js';
import { AttendanceStatus } from '@prisma/client';
import { QRCodeService } from '../qrcode/qrcode.service.js';

export class AttendanceService {
  static async checkIn(userId: string, dto: CheckInDto, file?: Express.Multer.File, userAgent?: string) {
    if (!file) {
      throw new BadRequestError('Foto selfie presensi wajib diupload');
    }

    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId },
      include: { school: true }
    });

    const school = teacherProfile?.school || 
      await prisma.school.findUnique({ where: { id: 'school-sd-inpres-pajjaiang-2' } }) || 
      await prisma.school.findFirst();

    if (!school) {
      throw new BadRequestError('Data lokasi sekolah belum diatur oleh administrator');
    }

    if (dto.qrToken) {
      QRCodeService.verifyToken(dto.qrToken);
    }

    const distanceMeters = GeoHelper.calculateDistanceMeters(
      dto.latitude ?? school.latitude,
      dto.longitude ?? school.longitude,
      school.latitude,
      school.longitude
    );

    if (distanceMeters > school.radiusMeters) {
      throw new BadRequestError(
        `Presensi gagal. Anda berada di luar radius sekolah (${distanceMeters}m dari lokasi sekolah, batas maksimal ${school.radiusMeters}m)`
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await AttendanceRepository.findTodayAttendance(userId, today);
    if (existingAttendance) {
      throw new BadRequestError('Anda sudah melakukan presensi masuk hari ini');
    }

    const now = new Date();
    const selectedShift = dto.selectedShift || 'SHIFT_1';
    const scheduledShift = (teacherProfile as any)?.defaultShift || 'SHIFT_1';
    const isShiftOverride = selectedShift !== scheduledShift;

    // Shift 1: 07:30 - 15:00 | Shift 2: 10:00 - 17:00
    const [startHour, startMinute] = selectedShift === 'SHIFT_2' ? [10, 0] : [7, 30];
    const shiftStart = new Date();
    shiftStart.setHours(startHour, startMinute, 0, 0);

    // Earliest check-in window: 60 minutes before shiftStart (Shift 1 = 06:30 WITA, Shift 2 = 09:00 WITA)
    const earliestAllowed = new Date(shiftStart.getTime() - 60 * 60 * 1000);
    if (now < earliestAllowed) {
      const earliestFormatted = earliestAllowed.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      throw new BadRequestError(
        `Presensi masuk belum dibuka. Anda baru dapat melakukan presensi masuk mulai pukul ${earliestFormatted} WITA (1 jam sebelum jam shift).`
      );
    }

    let status: AttendanceStatus = AttendanceStatus.PRESENT;
    let lateCheckinMinutes = 0;
    if (now > shiftStart) {
      status = AttendanceStatus.LATE;
      lateCheckinMinutes = Math.floor((now.getTime() - shiftStart.getTime()) / (1000 * 60));
    }

    const selfieUrl = `/uploads/selfies/${file.filename}`;

    const attendance = await AttendanceRepository.createAttendance({
      userId,
      date: today,
      checkInTime: now,
      status,
      selectedShift,
      scheduledShift,
      lateCheckinMinutes,
      isShiftOverride,
      overrideReason: dto.overrideReason,
      latitude: dto.latitude ?? school.latitude,
      longitude: dto.longitude ?? school.longitude,
      distanceMeters,
      selfieUrl,
      qrTokenUsed: dto.qrToken,
      deviceInfo: userAgent,
      notes: dto.notes
    });

    return {
      attendance,
      school: { name: school.name, distanceMeters }
    };
  }

  static async checkOut(userId: string, dto: CheckOutDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await AttendanceRepository.findTodayAttendance(userId, today);
    if (!attendance) {
      const now = new Date();
      return AttendanceRepository.createAttendance({
        userId,
        date: today,
        checkInTime: now,
        status: AttendanceStatus.PRESENT,
        latitude: dto.latitude || -5.1061803,
        longitude: dto.longitude || 119.5345679,
        distanceMeters: 0,
        selfieUrl: '/uploads/selfies/checkout-default.jpg',
        notes: dto.notes || 'Presensi Pulang'
      });
    }

    if (attendance.checkOutTime) {
      throw new BadRequestError('Anda sudah melakukan presensi pulang hari ini');
    }

    const now = new Date();
    let rawWorkDuration = 0;
    if (attendance.checkInTime) {
      rawWorkDuration = Math.floor((now.getTime() - new Date(attendance.checkInTime).getTime()) / (1000 * 60));
    }

    // Cap daily working duration at 6 hours max (360 minutes max per day)
    const workDurationMinutes = Math.min(Math.max(rawWorkDuration, 0), 360);

    // Shift 1 ends at 15:00, Shift 2 ends at 17:00
    const [endHour, endMinute] = (attendance as any).selectedShift === 'SHIFT_2' ? [17, 0] : [15, 0];
    const shiftEnd = new Date();
    shiftEnd.setHours(endHour, endMinute, 0, 0);

    let earlyCheckoutMinutes = 0;
    if (now < shiftEnd) {
      earlyCheckoutMinutes = Math.floor((shiftEnd.getTime() - now.getTime()) / (1000 * 60));
    }

    const updated = await AttendanceRepository.updateCheckOut(
      attendance.id,
      now,
      workDurationMinutes,
      earlyCheckoutMinutes,
      dto.earlyCheckoutReason,
      dto.notes
    );

    return updated;
  }

  static async getMyHistory(userId: string) {
    return AttendanceRepository.getUserAttendanceHistory(userId);
  }
}
