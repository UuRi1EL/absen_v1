import jwt from 'jsonwebtoken';
import { env } from '../config/env.config.js';
import { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  nip: string;
  role: Role;
}

export class JwtHelper {
  static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: '15m'
    });
  }

  static generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: '7d'
    });
  }

  static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
  }

  static verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
  }
}
