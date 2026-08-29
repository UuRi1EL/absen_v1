import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../errors/app-error.js';

export const roleMiddleware = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Pengguna belum terautentikasi');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('Anda tidak memiliki hak akses untuk fungsi ini');
    }

    next();
  };
};
