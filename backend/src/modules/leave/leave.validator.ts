import { z } from 'zod';
import { LeaveStatus } from '@prisma/client';

export const createLeaveSchema = z.object({
  startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
  endDate: z.string().min(1, 'Tanggal selesai wajib diisi'),
  reason: z.string().min(3, 'Alasan izin minimal 3 karakter')
});

export const updateLeaveStatusSchema = z.object({
  status: z.nativeEnum(LeaveStatus)
});

export type CreateLeaveDto = z.infer<typeof createLeaveSchema>;
export type UpdateLeaveStatusDto = z.infer<typeof updateLeaveStatusSchema>;
