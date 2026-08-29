import { prisma } from '../../config/database.config.js';

export class SchoolService {
  static async getSchoolDetails() {
    const school = await prisma.school.findUnique({
      where: { id: 'school-sd-inpres-pajjaiang-2' }
    });
    return school || prisma.school.findFirst();
  }

  static async updateSchoolDetails(data: {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    radiusMeters?: number;
    operatorPhone?: string;
  }) {
    const existing = await this.getSchoolDetails();
    if (!existing) {
      return prisma.school.create({
        data: {
          id: 'school-sd-inpres-pajjaiang-2',
          name: data.name || 'UPT SPF SD INPRES PAJJAIANG 2',
          address: data.address || 'Jl. Luwu Raya No.2 Perumnas Sudiang, Sudiang Raya, Kec. Biringkanaya, Kota Makassar',
          latitude: data.latitude || -5.1061803,
          longitude: data.longitude || 119.5345679,
          radiusMeters: data.radiusMeters || 150.0,
          operatorPhone: data.operatorPhone || '085298499891'
        }
      });
    }

    return prisma.school.update({
      where: { id: existing.id },
      data
    });
  }
}
