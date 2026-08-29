import { ScheduleRepository } from './schedule.repository.js';

export class ScheduleService {
  static async getAllSchedules(year?: number, month?: number, week?: number) {
    return ScheduleRepository.getAllSchedules(year, month, week);
  }

  static async getUserSchedules(userId: string, year?: number, month?: number, week?: number) {
    return ScheduleRepository.getUserSchedules(userId, year, month, week);
  }

  static async saveBatchSchedules(
    schedules: Array<{ userId: string; year?: number; month?: number; week?: number; dayOfWeek: number; shift: 'SHIFT_1' | 'SHIFT_2' }>,
    batchYear?: number,
    batchMonth?: number,
    batchWeek?: number
  ) {
    const results = [];
    const defaultYear = batchYear || new Date().getFullYear();
    const defaultMonth = batchMonth || new Date().getMonth() + 1;
    const defaultWeek = batchWeek || 1;

    for (const item of schedules) {
      const y = item.year || defaultYear;
      const m = item.month || defaultMonth;
      const w = item.week || defaultWeek;
      const res = await ScheduleRepository.upsertShiftSchedule(item.userId, y, m, w, item.dayOfWeek, item.shift);
      results.push(res);
    }
    return results;
  }
}
