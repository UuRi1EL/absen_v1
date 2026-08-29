import { z } from 'zod';

export const checkInSchema = z.object({
  latitude: z.union([z.number(), z.string().transform(Number)]),
  longitude: z.union([z.number(), z.string().transform(Number)]),
  qrToken: z.string().optional(),
  selectedShift: z.enum(['SHIFT_1', 'SHIFT_2']).default('SHIFT_1'),
  overrideReason: z.string().optional(),
  notes: z.string().optional()
});

export const checkOutSchema = z.object({
  latitude: z.union([z.number(), z.string().transform(Number)]).optional(),
  longitude: z.union([z.number(), z.string().transform(Number)]).optional(),
  earlyCheckoutReason: z.string().optional(),
  notes: z.string().optional()
});

export type CheckInDto = {
  latitude: number;
  longitude: number;
  qrToken?: string;
  selectedShift?: 'SHIFT_1' | 'SHIFT_2';
  overrideReason?: string;
  notes?: string;
};

export type CheckOutDto = {
  latitude?: number;
  longitude?: number;
  earlyCheckoutReason?: string;
  notes?: string;
};
