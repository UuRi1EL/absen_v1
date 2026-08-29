import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import attendanceRoutes from '../modules/attendance/attendance.routes.js';
import leaveRoutes from '../modules/leave/leave.routes.js';
import reportRoutes from '../modules/report/report.routes.js';
import userRoutes from '../modules/user/user.routes.js';
import qrcodeRoutes from '../modules/qrcode/qrcode.routes.js';
import schoolRoutes from '../modules/school/school.routes.js';
import scheduleRoutes from '../modules/schedule/schedule.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leave', leaveRoutes);
router.use('/reports', reportRoutes);
router.use('/users', userRoutes);
router.use('/qrcode', qrcodeRoutes);
router.use('/school', schoolRoutes);
router.use('/schedule', scheduleRoutes);

export default router;
