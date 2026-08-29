import { Router } from 'express';
import { SchoolController } from './school.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { asyncHandler } from '../../utils/async-handler.util.js';
import { Role } from '@prisma/client';

const router = Router();

// Public: VIEW school location & operator info (for login page & app)
router.get('/', asyncHandler(SchoolController.getDetails));

// Protected routes below
router.use(authMiddleware);

// ONLY ADMIN / OPERATOR can EDIT school GPS coordinates & geofencing radius
router.patch('/', roleMiddleware(Role.ADMIN), asyncHandler(SchoolController.updateDetails));

export default router;
