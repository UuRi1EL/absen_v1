import { Request, Response, NextFunction } from 'express';
import { JwtHelper, JwtPayload } from '../helpers/jwt.helper.js';
import { UnauthorizedError } from '../errors/app-error.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Akses ditolak. Token tidak ditemukan');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = JwtHelper.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    throw new UnauthorizedError('Token tidak valid atau telah kedaluwarsa');
  }
};
