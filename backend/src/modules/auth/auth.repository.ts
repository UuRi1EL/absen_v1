import { prisma } from '../../config/database.config.js';
import { User, RefreshToken } from '@prisma/client';

export class AuthRepository {
  static async findUserByNip(identifier: string): Promise<User | null> {
    const clean = identifier.trim();
    return prisma.user.findFirst({
      where: {
        OR: [
          { nip: { equals: clean, mode: 'insensitive' } },
          { email: { equals: clean, mode: 'insensitive' } }
        ]
      }
    });
  }

  static async findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        teacherProfile: {
          include: { school: true }
        }
      }
    });
  }

  static async saveRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt
      }
    });
  }

  static async findRefreshToken(token: string): Promise<(RefreshToken & { user: User }) | null> {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true }
    });
  }

  static async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token },
      data: { isRevoked: true }
    });
  }

  static async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true }
    });
  }
}
