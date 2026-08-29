import { Router } from 'express';
import { ScheduleController } from './schedule.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/my', ScheduleController.getMySchedules);
router.get('/', roleMiddleware('ADMIN' as any, 'PRINCIPAL' as any), ScheduleController.getAllSchedules);
router.post('/batch', roleMiddleware('ADMIN' as any, 'PRINCIPAL' as any), ScheduleController.saveBatchSchedules);

export default router;
