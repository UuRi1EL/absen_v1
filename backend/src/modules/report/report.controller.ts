import { Request, Response } from 'express';
import { ReportService } from './report.service.js';
import { ApiResponse } from '../../utils/api-response.util.js';

export class ReportController {
  static async getMonthlyReport(req: Request, res: Response) {
    const month = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1;
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

    const report = await ReportService.getMonthlySummary(month, year);
    return ApiResponse.success(res, 'Laporan rekapitulasi bulanan berhasil diambil', report);
  }
}
