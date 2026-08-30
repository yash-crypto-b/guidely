import { z } from 'zod';

export const updateMentorProfileSchema = z.object({
  company: z.string().max(100).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  yearsExperience: z.number().int().min(0).max(60).optional().nullable(),
  languages: z.array(z.string()).optional(),
  linkedInUrl: z.string().url().optional().nullable(),
  portfolioUrl: z.string().url().optional().nullable(),
  hourlyRate: z.number().int().min(0).optional().nullable(),
  headline: z.string().max(200).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  expertiseTags: z.array(z.string()).optional(),
  socialLinks: z.array(z.object({
    platform: z.string(),
    url: z.string().url(),
  })).optional(),
});

export const createServiceSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().max(2000).optional(),
  duration: z.number().int().min(15, 'Minimum 15 minutes').max(480, 'Maximum 8 hours'),
  price: z.number().int().min(0),
  isFree: z.boolean().optional().default(false),
  deliveryType: z.enum(['VIDEO_CALL', 'RESUME_REVIEW', 'MOCK_INTERVIEW', 'CAREER_GUIDANCE', 'ASYNC_MESSAGE', 'PORTFOLIO_REVIEW']).optional().default('VIDEO_CALL'),
  maxBookingsPerDay: z.number().int().min(1).max(100).optional(),
  availableDays: z.array(z.number().int().min(0).max(6)).optional().default([1, 2, 3, 4, 5]),
});

export const updateServiceSchema = createServiceSchema.partial();

export const searchMentorsSchema = z.object({
  search: z.string().optional(),
  industry: z.string().optional(),
  role: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experienceLevel: z.string().optional(),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().optional(),
  language: z.string().optional(),
  deliveryType: z.string().optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(50).optional().default(20),
});

export const saveMentorSchema = z.object({
  mentorId: z.string().uuid(),
});

export const createBookingRequestSchema = z.object({
  serviceId: z.string().uuid(),
  startTime: z.string().datetime(),
  bookingMetadata: z.string().max(2000).optional(),
  referralSource: z.enum(['direct', 'marketplace']).optional().default('marketplace'),
});

export const earningsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type UpdateMentorProfileInput = z.infer<typeof updateMentorProfileSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type SearchMentorsInput = z.infer<typeof searchMentorsSchema>;
export type CreateBookingRequestInput = z.infer<typeof createBookingRequestSchema>;
