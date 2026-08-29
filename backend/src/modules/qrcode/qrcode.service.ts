import jwt from 'jsonwebtoken';
import { env } from '../../config/env.config.js';
import { prisma } from '../../config/database.config.js';

export class QRCodeService {
  static async generateDynamicToken() {
    const school = await prisma.school.findFirst();
    const timestamp = Date.now();

    // Expire in 30 seconds to prevent proxy attendance
    const payload = {
      schoolId: school?.id || 'school-sd-inpres-pajjaiang-2',
      schoolName: 'UPT SPF SD INPRES PAJJAIANG 2',
      timestamp
    };

    const qrToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '30s' });

    return {
      qrToken,
      expiresInSeconds: 30,
      timestamp
    };
  }

  static verifyToken(qrToken: string) {
    try {
      const decoded = jwt.verify(qrToken, env.JWT_ACCESS_SECRET) as any;
      return decoded;
    } catch (err) {
      throw new Error('Kode QR telah kadaluarsa atau tidak valid. Silakan pindai ulang.');
    }
  }
}
