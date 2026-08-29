import { Request, Response } from 'express';
import { LeaveService } from './leave.service.js';
import { createLeaveSchema, updateLeaveStatusSchema } from './leave.validator.js';
import { ApiResponse } from '../../utils/api-response.util.js';
import { HttpStatus } from '../../constants/http-status.constant.js';

export class LeaveController {
  static async create(req: Request, res: Response) {
    const dto = createLeaveSchema.parse(req.body);
    const teacherId = req.user!.userId;

    const result = await LeaveService.createRequest(teacherId, dto, req.file);
    return ApiResponse.success(res, 'Pengajuan izin berhasil dibuat', result, HttpStatus.CREATED);
  }

  static async getMine(req: Request, res: Response) {
    const teacherId = req.user!.userId;
    const requests = await LeaveService.getMyRequests(teacherId);
    return ApiResponse.success(res, 'Daftar pengajuan izin saya berhasil diambil', requests);
  }

  static async getAll(_req: Request, res: Response) {
    const requests = await LeaveService.getAllRequests();
    return ApiResponse.success(res, 'Daftar seluruh pengajuan izin berhasil diambil', requests);
  }

  static async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = updateLeaveStatusSchema.parse(req.body);
    const approvedById = req.user!.userId;

    const updated = await LeaveService.updateStatus(id, approvedById, status);
    return ApiResponse.success(res, `Status pengajuan izin berhasil diubah menjadi ${status}`, updated);
  }
}
