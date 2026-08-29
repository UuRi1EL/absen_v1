import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { loginSchema } from './auth.validator.js';
import { ApiResponse } from '../../utils/api-response.util.js';
import { HttpStatus } from '../../constants/http-status.constant.js';

export class AuthController {
  static async login(req: Request, res: Response) {
    const dto = loginSchema.parse(req.body);
    const result = await AuthService.login(dto);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return ApiResponse.success(res, 'Login berhasil', {
      accessToken: result.accessToken,
      user: result.user
    }, HttpStatus.OK);
  }

  static async refreshToken(req: Request, res: Response) {
    const tokenFromCookie = req.cookies?.refreshToken;
    const tokenFromBody = req.body.refreshToken;
    const token = tokenFromCookie || tokenFromBody;

    const result = await AuthService.refreshToken(token);
    return ApiResponse.success(res, 'Token berhasil diperbarui', result);
  }

  static async logout(req: Request, res: Response) {
    const tokenFromCookie = req.cookies?.refreshToken;
    const tokenFromBody = req.body.refreshToken;
    const token = tokenFromCookie || tokenFromBody;

    await AuthService.logout(token);
    res.clearCookie('refreshToken');
    return ApiResponse.success(res, 'Logout berhasil');
  }

  static async me(req: Request, res: Response) {
    const userId = req.user!.userId;
    const user = await AuthService.getMe(userId);
    return ApiResponse.success(res, 'Profil pengguna berhasil diambil', user);
  }

  static async changePassword(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { oldPassword, newPassword } = req.body;
    const result = await AuthService.changePassword(userId, oldPassword, newPassword);
    return ApiResponse.success(res, result.message);
  }
}
