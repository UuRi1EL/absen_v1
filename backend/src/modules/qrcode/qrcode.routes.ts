import { Router } from 'express';
import { QRCodeController } from './qrcode.controller.js';
import { asyncHandler } from '../../utils/async-handler.util.js';

const router = Router();

// Public / Terminal Route for dynamic QR display
router.get('/generate', asyncHandler(QRCodeController.generateToken));

export default router;
