import { z } from 'zod';

export const loginSchema = z.object({
  nip: z.string().min(1, 'NIP atau Email kedinasan wajib diisi'),
  password: z.string().min(1, 'Kata sandi wajib diisi')
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional()
});

export type LoginDto = z.infer<typeof loginSchema>;
