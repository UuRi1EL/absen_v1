import { Router } from 'express';
import { UserController } from './user.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { selfieUpload } from '../../middlewares/upload.middleware.js';
import { asyncHandler } from '../../utils/async-handler.util.js';
import { prisma } from '../../config/database.config.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authMiddleware);

// Upload profile avatar photo
router.post(
  '/avatar',
  selfieUpload.single('avatar'),
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const avatarUrl = req.file ? `/uploads/selfies/${req.file.filename}` : undefined;
    if (!avatarUrl) {
      return res.status(400).json({ status: 'error', message: 'File foto profil wajib diunggah' });
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl }
    });
    return res.json({ status: 'success', message: 'Foto profil berhasil diperbarui', data: updated });
  })
);

router.get('/', roleMiddleware(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER), asyncHandler(UserController.getAll));
router.post('/', roleMiddleware(Role.ADMIN, Role.PRINCIPAL), asyncHandler(UserController.create));
router.patch('/profile', asyncHandler(UserController.updateMyProfile));
router.patch('/:id/reset-password', roleMiddleware(Role.ADMIN, Role.PRINCIPAL), asyncHandler(UserController.resetPassword));
router.patch('/:id/toggle-active', roleMiddleware(Role.ADMIN, Role.PRINCIPAL), asyncHandler(UserController.toggleActive));
router.patch('/:id', roleMiddleware(Role.ADMIN, Role.PRINCIPAL), asyncHandler(UserController.updateUserById));
router.delete('/:id', roleMiddleware(Role.ADMIN), asyncHandler(UserController.deleteUserById));

export default router;
