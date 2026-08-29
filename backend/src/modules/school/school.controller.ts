import { Request, Response } from 'express';
import { SchoolService } from './school.service.js';
import { ApiResponse } from '../../utils/api-response.util.js';

export class SchoolController {
  static async getDetails(_req: Request, res: Response) {
    const school = await SchoolService.getSchoolDetails();
    return ApiResponse.success(res, 'Detail sekolah berhasil diambil', school);
  }

  static async updateDetails(req: Request, res: Response) {
    const { name, address, latitude, longitude, radiusMeters, operatorPhone } = req.body;
    const updated = await SchoolService.updateSchoolDetails({
      name,
      address,
      latitude: latitude !== undefined && latitude !== '' ? Number(latitude) : undefined,
      longitude: longitude !== undefined && longitude !== '' ? Number(longitude) : undefined,
      radiusMeters: radiusMeters !== undefined && radiusMeters !== '' ? Number(radiusMeters) : undefined,
      operatorPhone: operatorPhone !== undefined ? String(operatorPhone).trim() : undefined
    });
    return ApiResponse.success(res, 'Pengaturan GPS Geofencing & Nomor Operator sekolah berhasil diperbarui', updated);
  }
}
