import multer from 'multer';
import { BadRequestError } from '../errors/app-error.js';

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  // Allow all image mimetypes and octet-stream for mobile camera compatibility
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/octet-stream') {
    cb(null, true);
  } else {
    cb(new BadRequestError('Tipe file tidak didukung. Harap upload foto berupa gambar.'));
  }
};

export const selfieUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});
