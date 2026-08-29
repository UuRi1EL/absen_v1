import { ReportRepository } from './report.repository.js';

export class ReportService {
  static async getMonthlySummary(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const [attendances, leaves, teachers] = await Promise.all([
      ReportRepository.getMonthlyAttendanceRecords(startDate, endDate),
      ReportRepository.getMonthlyLeaveRequests(startDate, endDate),
      ReportRepository.getAllActiveTeachers()
    ]);

    // Aggregate monthly report for each teacher
    const summaryPerTeacher = teachers.map((teacher) => {
      const teacherAttendances = attendances.filter((a) => a.userId === teacher.id);
      const teacherLeaves = leaves.filter((l) => l.teacherId === teacher.id);

      const presentCount = teacherAttendances.filter((a) => a.status === 'PRESENT').length;
      const lateCount = teacherAttendances.filter((a) => a.status === 'LATE').length;
      
      // Calculate unique leave dates accurately from startDate to endDate
      const leaveDatesSet = new Set<string>();
      teacherLeaves.forEach((l) => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        
        // Normalize time to local midnight
        const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());

        while (cur.getTime() <= last.getTime()) {
          // Exclude Sundays (cur.getDay() === 0) since Sunday is an official non-school work day
          if (cur.getDay() !== 0) {
            const yyyy = cur.getFullYear();
            const mm = String(cur.getMonth() + 1).padStart(2, '0');
            const dd = String(cur.getDate()).padStart(2, '0');
            leaveDatesSet.add(`${yyyy}-${mm}-${dd}`);
          }
          cur.setDate(cur.getDate() + 1);
        }
      });
      const leaveCount = leaveDatesSet.size;
      const totalHadir = presentCount + lateCount;

      const shift1Count = teacherAttendances.filter((a) => (a as any).selectedShift === 'SHIFT_1' || !(a as any).selectedShift).length;
      const shift2Count = teacherAttendances.filter((a) => (a as any).selectedShift === 'SHIFT_2').length;

      const totalWorkMinutes = teacherAttendances.reduce((acc, a: any) => {
        if (a.workDurationMinutes && a.workDurationMinutes > 0) {
          return acc + a.workDurationMinutes;
        }
        if (a.checkInTime && a.checkOutTime) {
          const duration = Math.floor(
            (new Date(a.checkOutTime).getTime() - new Date(a.checkInTime).getTime()) / (1000 * 60)
          );
          return acc + Math.min(Math.max(duration, 0), 360);
        }
        if (a.checkInTime && !a.checkOutTime) {
          const duration = Math.floor(
            (new Date().getTime() - new Date(a.checkInTime).getTime()) / (1000 * 60)
          );
          return acc + Math.min(Math.max(duration, 0), 360);
        }
        return acc;
      }, 0);
      const totalLateMinutes = teacherAttendances.reduce((acc, a) => acc + ((a as any).lateCheckinMinutes || 0), 0);
      const totalEarlyCheckoutMinutes = teacherAttendances.reduce((acc, a) => acc + ((a as any).earlyCheckoutMinutes || 0), 0);

      // Group attendances into 5 weeks for clean reporting
      const weeklyStats = [
        { weekNumber: 1, label: 'Pekan 1 (Tgl 1-7)', startDay: 1, endDay: 7 },
        { weekNumber: 2, label: 'Pekan 2 (Tgl 8-14)', startDay: 8, endDay: 14 },
        { weekNumber: 3, label: 'Pekan 3 (Tgl 15-21)', startDay: 15, endDay: 21 },
        { weekNumber: 4, label: 'Pekan 4 (Tgl 22-28)', startDay: 22, endDay: 28 },
        { weekNumber: 5, label: 'Pekan 5 (Tgl 29-31)', startDay: 29, endDay: 31 }
      ].map((w) => {
        const weekAttendances = teacherAttendances.filter((a) => {
          const day = new Date(a.date).getDate();
          return day >= w.startDay && day <= w.endDay;
        });
        const minutes = weekAttendances.reduce((acc, a) => acc + ((a as any).workDurationMinutes || 0), 0);
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return {
          ...w,
          workMinutes: minutes,
          formattedDuration: `${hours} Jam ${mins} Menit`
        };
      });

      const totalHours = Math.floor(totalWorkMinutes / 60);
      const totalMins = totalWorkMinutes % 60;

      return {
        id: teacher.id,
        nip: teacher.nip,
        fullName: teacher.fullName,
        position: teacher.teacherProfile?.position || 'Guru Kelas',
        presentCount,
        lateCount,
        leaveCount,
        totalHadir,
        shift1Count,
        shift2Count,
        totalWorkMinutes,
        formattedTotalWork: `${totalHours} Jam ${totalMins} Menit`,
        totalLateMinutes,
        totalEarlyCheckoutMinutes,
        weeklyStats
      };
    });

    return {
      period: {
        month,
        year,
        startDate,
        endDate
      },
      totalTeachers: teachers.length,
      summary: summaryPerTeacher,
      rawAttendances: attendances
    };
  }
}
