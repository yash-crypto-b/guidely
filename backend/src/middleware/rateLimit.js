import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

// Global IP-based limiter. A stricter AI-endpoint limiter (AI_RATE_LIMIT_*) is
// added alongside the AI routes in M6, where it actually gets used.
export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
