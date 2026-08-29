import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.util.js';

const router = Router();

router.post('/login', asyncHandler(AuthController.login));
router.post('/refresh-token', asyncHandler(AuthController.refreshToken));
router.post('/logout', asyncHandler(AuthController.logout));
router.get('/me', authMiddleware, asyncHandler(AuthController.me));
router.post('/change-password', authMiddleware, asyncHandler(AuthController.changePassword));

export default router;
