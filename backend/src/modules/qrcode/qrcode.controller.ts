import { Request, Response } from 'express';
import { QRCodeService } from './qrcode.service.js';
import { ApiResponse } from '../../utils/api-response.util.js';

export class QRCodeController {
  static async generateToken(_req: Request, res: Response) {
    const data = await QRCodeService.generateDynamicToken();
    return ApiResponse.success(res, 'Kode QR Token Dinamis Sekolah berhasil dibuat', data);
  }
}
