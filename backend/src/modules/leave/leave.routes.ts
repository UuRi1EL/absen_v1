import { Router } from 'express';
import { LeaveController } from './leave.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { selfieUpload } from '../../middlewares/upload.middleware.js';
import { asyncHandler } from '../../utils/async-handler.util.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authMiddleware);

// Teacher creates leave request
router.post(
  '/request',
  roleMiddleware(Role.TEACHER, Role.ADMIN, Role.PRINCIPAL),
  selfieUpload.single('attachment'),
  asyncHandler(LeaveController.create)
);

// Teacher fetches their own leave requests
router.get('/my-requests', asyncHandler(LeaveController.getMine));

// Admin & Principal fetch all leave requests
router.get('/', roleMiddleware(Role.ADMIN, Role.PRINCIPAL), asyncHandler(LeaveController.getAll));

// Principal & Admin approve or reject leave request
router.patch(
  '/:id/status',
  roleMiddleware(Role.ADMIN, Role.PRINCIPAL),
  asyncHandler(LeaveController.updateStatus)
);

export default router;
