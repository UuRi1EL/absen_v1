import { Request, Response } from 'express';
import { ScheduleService } from './schedule.service.js';

export class ScheduleController {
  static async getAllSchedules(req: Request, res: Response) {
    try {
      const year = req.query.year ? Number(req.query.year) : undefined;
      const month = req.query.month ? Number(req.query.month) : undefined;
      const week = req.query.week ? Number(req.query.week) : undefined;

      const data = await ScheduleService.getAllSchedules(year, month, week);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getMySchedules(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const year = req.query.year ? Number(req.query.year) : undefined;
      const month = req.query.month ? Number(req.query.month) : undefined;
      const week = req.query.week ? Number(req.query.week) : undefined;

      const data = await ScheduleService.getUserSchedules(userId, year, month, week);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async saveBatchSchedules(req: Request, res: Response) {
    try {
      const { schedules, year, month, week } = req.body;
      if (!Array.isArray(schedules)) {
        return res.status(400).json({ success: false, message: 'Data schedules harus berupa array' });
      }
      const data = await ScheduleService.saveBatchSchedules(schedules, Number(year), Number(month), Number(week));
      return res.json({ success: true, data, message: 'Jadwal shift berhasil diperbarui!' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
