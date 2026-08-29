import { Request, Response } from 'express';
import { UserService } from './user.service.js';
import { createUserSchema } from './user.validator.js';
import { ApiResponse } from '../../utils/api-response.util.js';
import { HttpStatus } from '../../constants/http-status.constant.js';

export class UserController {
  static async getAll(_req: Request, res: Response) {
    const users = await UserService.getAllUsers();
    return ApiResponse.success(res, 'Daftar seluruh pengguna berhasil diambil', users);
  }

  static async create(req: Request, res: Response) {
    const dto = createUserSchema.parse(req.body);
    const result = await UserService.createUser(dto);
    return ApiResponse.success(res, 'Akun guru/pengguna baru berhasil dibuat', result, HttpStatus.CREATED);
  }

  static async toggleActive(req: Request, res: Response) {
    const { id } = req.params;
    const { isActive } = req.body;

    const result = await UserService.toggleActive(id, Boolean(isActive));
    return ApiResponse.success(
      res,
      `Status akun berhasil diubah menjadi ${isActive ? 'AKTIF' : 'NONAKTIF'}`,
      result
    );
  }

  static async resetPassword(req: Request, res: Response) {
    const { id } = req.params;
    const { newPassword } = req.body;

    const result = await UserService.resetPassword(id, newPassword);
    return ApiResponse.success(res, 'Password pengguna berhasil di-reset', result);
  }

  static async updateMyProfile(req: Request, res: Response) {
    const userId = req.user!.userId;
    const updated = await UserService.updateUserProfile(userId, req.body);
    return ApiResponse.success(res, 'Profil Dapodik & SIMPKB Anda berhasil diperbarui', updated);
  }

  static async updateUserById(req: Request, res: Response) {
    const { id } = req.params;
    const updated = await UserService.updateUserProfile(id, req.body);
    return ApiResponse.success(res, 'Informasi profil guru berhasil diperbarui', updated);
  }
}
