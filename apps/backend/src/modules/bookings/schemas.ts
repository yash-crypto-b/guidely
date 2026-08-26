import { z } from 'zod';

export const createBookingSchema = z.object({
  creatorId: z.string().uuid(),
  sessionTypeId: z.string().uuid(),
  startTime: z.string().datetime(),
  studentNotes: z.string().max(1000).optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
  cancellationReason: z.string().max(500).optional(),
});

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
