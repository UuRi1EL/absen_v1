import { prisma } from '../../config/database.config.js';
import { Attendance, AttendanceStatus } from '@prisma/client';

export class AttendanceRepository {
  static async findTodayAttendance(userId: string, _date?: Date): Promise<Attendance | null> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.attendance.findFirst({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async createAttendance(data: {
    userId: string;
    date: Date;
    checkInTime: Date;
    status: AttendanceStatus;
    selectedShift?: any;
    scheduledShift?: any;
    lateCheckinMinutes?: number;
    isShiftOverride?: boolean;
    overrideReason?: string;
    latitude: number;
    longitude: number;
    distanceMeters: number;
    selfieUrl: string;
    qrTokenUsed?: string;
    deviceInfo?: string;
    notes?: string;
  }): Promise<Attendance> {
    const payload: any = {
      userId: data.userId,
      date: data.date,
      checkInTime: data.checkInTime,
      status: data.status,
      latitude: data.latitude,
      longitude: data.longitude,
      distanceMeters: data.distanceMeters,
      selfieUrl: data.selfieUrl,
      deviceInfo: data.deviceInfo,
      qrTokenUsed: data.qrTokenUsed,
      notes: data.notes
    };

    if (data.selectedShift) payload.selectedShift = data.selectedShift;
    if (data.scheduledShift) payload.scheduledShift = data.scheduledShift;
    if (data.lateCheckinMinutes !== undefined) payload.lateCheckinMinutes = data.lateCheckinMinutes;
    if (data.isShiftOverride !== undefined) payload.isShiftOverride = data.isShiftOverride;
    if (data.overrideReason) payload.overrideReason = data.overrideReason;

    try {
      return await prisma.attendance.create({ data: payload });
    } catch (err: any) {
      console.warn('⚠️ Prisma Client fallback: stripping ungenerated shift columns for attendance creation:', err?.message);
      delete payload.selectedShift;
      delete payload.scheduledShift;
      delete payload.lateCheckinMinutes;
      delete payload.isShiftOverride;
      delete payload.overrideReason;
      return await prisma.attendance.create({ data: payload });
    }
  }

  static async updateCheckOut(
    id: string,
    checkOutTime: Date,
    workDurationMinutes?: number,
    earlyCheckoutMinutes?: number,
    earlyCheckoutReason?: string,
    notes?: string
  ): Promise<Attendance> {
    const updateData: any = {
      checkOutTime,
      notes: notes ? notes : undefined
    };

    if (workDurationMinutes !== undefined) updateData.workDurationMinutes = workDurationMinutes;
    if (earlyCheckoutMinutes !== undefined) updateData.earlyCheckoutMinutes = earlyCheckoutMinutes;
    if (earlyCheckoutReason !== undefined) updateData.earlyCheckoutReason = earlyCheckoutReason;

    try {
      return await prisma.attendance.update({
        where: { id },
        data: updateData
      });
    } catch (err: any) {
      console.warn('⚠️ Prisma Client fallback: stripping ungenerated shift columns for attendance update:', err?.message);
      delete updateData.workDurationMinutes;
      delete updateData.earlyCheckoutMinutes;
      delete updateData.earlyCheckoutReason;
      return await prisma.attendance.update({
        where: { id },
        data: updateData
      });
    }
  }

  static async getUserAttendanceHistory(userId: string, limit = 30): Promise<Attendance[]> {
    return prisma.attendance.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
}
