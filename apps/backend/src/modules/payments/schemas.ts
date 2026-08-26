import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  bookingId: z.string().uuid(),
});

export const createStripeAccountSchema = z.object({
  returnUrl: z.string().url(),
  refreshUrl: z.string().url(),
});
