import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  displayName: z.string().optional(),
  photoUrl: z.string().url().optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  headline: z.string().max(200).optional().nullable(),
  timezone: z.string().optional(),
  expertiseTags: z.array(z.string()).optional(),
  socialLinks: z.array(z.object({
    platform: z.string(),
    url: z.string().url(),
  })).optional(),
});

export const becomeCreatorSchema = z.object({
  headline: z.string().max(200).optional(),
  bio: z.string().max(1000).optional(),
  expertiseTags: z.array(z.string()).min(1, 'At least one expertise tag required'),
});

export const createSessionTypeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().max(1000).optional(),
  duration: z.number().int().min(15, 'Minimum 15 minutes').max(480, 'Maximum 8 hours'),
  price: z.number().int().min(0).optional(),
  isFree: z.boolean().optional(),
  type: z.enum(['ONE_ON_ONE', 'GROUP']).optional(),
  maxGroupSize: z.number().int().min(2).max(100).optional(),
});

export const setAvailabilitySchema = z.object({
  slots: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Must be HH:MM format'),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Must be HH:MM format'),
  })),
});

export const addBlackoutSchema = z.object({
  date: z.string().datetime(),
  reason: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateSessionTypeInput = z.infer<typeof createSessionTypeSchema>;
export type SetAvailabilityInput = z.infer<typeof setAvailabilitySchema>;
