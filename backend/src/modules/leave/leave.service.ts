import { LeaveRepository } from './leave.repository.js';
import { CreateLeaveDto } from './leave.validator.js';
import { BadRequestError, NotFoundError } from '../../errors/app-error.js';
import { LeaveStatus } from '@prisma/client';
import { prisma } from '../../config/database.config.js';

export class LeaveService {
  static async createRequest(teacherId: string, dto: CreateLeaveDto, file?: Express.Multer.File) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestError('Format tanggal mulai atau tanggal selesai tidak valid');
    }

    if (end < start) {
      throw new BadRequestError('Tanggal selesai tidak boleh sebelum tanggal mulai');
    }

    // Check for overlapping active (PENDING or APPROVED) leave requests
    const existing = await prisma.leaveRequest.findFirst({
      where: {
        teacherId,
        status: { in: ['PENDING', 'APPROVED'] },
        startDate: { lte: end },
        endDate: { gte: start }
      }
    });

    if (existing) {
      throw new BadRequestError(
        'Anda sudah memiliki pengajuan izin (Pending / Disetujui) yang tumpang tindih pada rentang tanggal tersebut.'
      );
    }

    const attachmentUrl = file ? `/uploads/selfies/${file.filename}` : undefined;

    return LeaveRepository.createLeaveRequest({
      teacherId,
      startDate: start,
      endDate: end,
      reason: dto.reason,
      attachment: attachmentUrl
    });
  }

  static async getMyRequests(teacherId: string) {
    return LeaveRepository.findTeacherLeaveRequests(teacherId);
  }

  static async getAllRequests() {
    return LeaveRepository.findAllLeaveRequests();
  }

  static async updateStatus(id: string, approvedById: string, status: LeaveStatus) {
    const request = await LeaveRepository.findById(id);
    if (!request) {
      throw new NotFoundError('Pengajuan izin tidak ditemukan');
    }

    return LeaveRepository.updateLeaveStatus(id, approvedById, status);
  }
}
