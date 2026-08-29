import { z } from 'zod';
import { Role } from '@prisma/client';

export const createUserSchema = z.object({
  nip: z.string().min(3, 'NIP minimal 3 karakter'),
  fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter').default('password123'),
  phone: z.string().optional(),
  role: z.nativeEnum(Role).default(Role.TEACHER),
  position: z.string().default('Guru Kelas'),
  department: z.string().default('Tenaga Pendidik')
});

export const updateUserSchema = z.object({
  nip: z.string().min(3, 'NIP minimal 3 karakter').optional(),
  fullName: z.string().min(3).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional()
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
