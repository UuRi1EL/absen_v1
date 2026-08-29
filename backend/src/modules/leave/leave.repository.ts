import { prisma } from '../../config/database.config.js';
import { LeaveRequest, LeaveStatus } from '@prisma/client';

export class LeaveRepository {
  static async createLeaveRequest(data: {
    teacherId: string;
    startDate: Date;
    endDate: Date;
    reason: string;
    attachment?: string;
  }): Promise<LeaveRequest> {
    return prisma.leaveRequest.create({
      data
    });
  }

  static async findTeacherLeaveRequests(teacherId: string): Promise<LeaveRequest[]> {
    return prisma.leaveRequest.findMany({
      where: { teacherId },
      include: {
        approvedBy: {
          select: { fullName: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async findAllLeaveRequests(): Promise<LeaveRequest[]> {
    return prisma.leaveRequest.findMany({
      include: {
        teacher: {
          select: { id: true, nip: true, fullName: true, email: true }
        },
        approvedBy: {
          select: { fullName: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async updateLeaveStatus(
    id: string,
    approvedById: string,
    status: LeaveStatus
  ): Promise<LeaveRequest> {
    return prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        approvedById,
        approvedAt: new Date()
      }
    });
  }

  static async findById(id: string): Promise<LeaveRequest | null> {
    return prisma.leaveRequest.findUnique({
      where: { id }
    });
  }
}
