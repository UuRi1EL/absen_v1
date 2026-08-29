import { prisma } from '../../config/database.config.js';

export class ReportRepository {
  static async getMonthlyAttendanceRecords(startDate: Date, endDate: Date) {
    return prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: {
          select: {
            id: true,
            nip: true,
            fullName: true,
            role: true,
            teacherProfile: {
              select: {
                position: true,
                department: true
              }
            }
          }
        }
      },
      orderBy: { date: 'asc' }
    });
  }

  static async getMonthlyLeaveRequests(startDate: Date, endDate: Date) {
    return prisma.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: endDate },
        endDate: { gte: startDate }
      },
      include: {
        teacher: {
          select: { id: true, nip: true, fullName: true }
        }
      }
    });
  }

  static async getAllActiveTeachers() {
    return prisma.user.findMany({
      where: { role: 'TEACHER', isActive: true },
      select: {
        id: true,
        nip: true,
        fullName: true,
        email: true,
        teacherProfile: {
          select: {
            position: true,
            department: true
          }
        }
      },
      orderBy: { fullName: 'asc' }
    });
  }
}
