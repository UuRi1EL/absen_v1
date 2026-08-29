import { Request, Response } from 'express';
import { AttendanceService } from './attendance.service.js';
import { checkInSchema, checkOutSchema } from './attendance.validator.js';
import { ApiResponse } from '../../utils/api-response.util.js';
import { HttpStatus } from '../../constants/http-status.constant.js';

export class AttendanceController {
  static async checkIn(req: Request, res: Response) {
    const parsed = checkInSchema.parse(req.body);
    const userId = req.user!.userId;
    const userAgent = req.headers['user-agent'];

    const result = await AttendanceService.checkIn(userId, parsed, req.file, userAgent);
    return ApiResponse.success(res, 'Presensi masuk berhasil dicatat', result, HttpStatus.CREATED);
  }

  static async checkOut(req: Request, res: Response) {
    const parsed = checkOutSchema.parse(req.body);
    const userId = req.user!.userId;

    const result = await AttendanceService.checkOut(userId, parsed);
    return ApiResponse.success(res, 'Presensi pulang berhasil dicatat', result, HttpStatus.OK);
  }

  static async myHistory(req: Request, res: Response) {
    const userId = req.user!.userId;
    const history = await AttendanceService.getMyHistory(userId);
    return ApiResponse.success(res, 'Riwayat presensi berhasil diambil', history);
  }
}
