import { Router } from 'express';
import { ReportController } from './report.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.util.js';

const router = Router();

router.use(authMiddleware);

router.get('/monthly', asyncHandler(ReportController.getMonthlyReport));

export default router;
