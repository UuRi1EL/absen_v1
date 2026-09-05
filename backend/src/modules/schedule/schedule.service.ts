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
    return ScheduleRepository.saveBatchSchedules(schedules, batchYear, batchMonth, batchWeek);
  }
}
