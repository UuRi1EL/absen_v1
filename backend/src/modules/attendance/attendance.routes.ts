import { Router, Request, Response, NextFunction } from 'express';
import { AttendanceController } from './attendance.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { selfieUpload } from '../../middlewares/upload.middleware.js';
import { asyncHandler } from '../../utils/async-handler.util.js';
import { Role } from '@prisma/client';
import multer from 'multer';

const router = Router();

router.use(authMiddleware);

// Safe Multer upload wrapper to return clean JSON error on upload failure
const uploadSelfieMiddleware = (req: Request, res: Response, next: NextFunction) => {
  selfieUpload.single('selfie')(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ status: 'error', message: 'Ukuran foto selfie terlalu besar (maksimal 15MB).' });
        }
        return res.status(400).json({ status: 'error', message: `Gagal mengunggah foto: ${err.message}` });
      }
      return res.status(400).json({ status: 'error', message: err.message || 'Gagal mengunggah foto selfie.' });
    }
    next();
  });
};

router.post(
  '/check-in',
  roleMiddleware(Role.TEACHER, Role.ADMIN, Role.PRINCIPAL),
  uploadSelfieMiddleware,
  asyncHandler(AttendanceController.checkIn)
);

router.post(
  '/check-out',
  roleMiddleware(Role.TEACHER, Role.ADMIN, Role.PRINCIPAL),
  asyncHandler(AttendanceController.checkOut)
);

router.get('/my-history', asyncHandler(AttendanceController.myHistory));

export default router;
