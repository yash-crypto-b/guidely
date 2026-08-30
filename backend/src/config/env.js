import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

// Load backend/.env if it exists (absolute path, so it works regardless of the
// process cwd). In production, env comes from the platform and no file is needed.
// NOTE: process.loadEnvFile() does NOT override existing env vars, so if the
// platform sets PORT=0 (as Freebuff does), the .env value is ignored. We read
// the file ourselves to guarantee .env values always take precedence in dev.
const envPath = join(import.meta.dirname, '../../.env');
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    process.env[key] = value;
  }
}

// Validate process.env at boot. Fail fast + loud if anything is missing or
// malformed — a misconfigured server should never start and serve broken auth
// or leak a half-configured state. Coerce numeric strings to numbers here so
// the rest of the app gets real types.

// Helper: strip quotes and trailing slashes from env vars (common copy-paste issues)
const clean = (v) => (typeof v === 'string' ? v.replace(/^['"]|['"]$/g, '').replace(/\/+$/, '') : v);
const envVal = (key) => clean(process.env[key]);

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  FRONTEND_ORIGIN: z.string().min(1, 'FRONTEND_ORIGIN is required'),

  SUPABASE_URL: z.string().min(1, 'SUPABASE_URL is required'),
  SUPABASE_SECRET_KEY: z.string().min(1, 'SUPABASE_SECRET_KEY is required'),
  SUPABASE_JWT_SECRET: z.string().optional(),

  // NVIDIA API configuration (OpenAI-compatible endpoint).
  NVIDIA_API_KEY: z.string().optional(),
  NVIDIA_MODEL: z.string().min(1).optional(),
  NVIDIA_BASE_URL: z.string().optional(),

  // Legacy aliases kept so existing local files do not break immediately.
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().min(1).optional(),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().min(1).optional(),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  AI_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(3_600_000),
  AI_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),

  // Redis (optional - falls back to in-memory if not set)
  REDIS_URL: z.string().optional(),

  // Quota limits (optional - defaults shown)
  ANALYSIS_QUOTA_PER_HOUR: z.coerce.number().int().positive().default(20),
  ANALYSIS_QUOTA_PER_DAY: z.coerce.number().int().positive().default(100),
  CV_QUOTA_PER_HOUR: z.coerce.number().int().positive().default(10),
  CV_QUOTA_PER_DAY: z.coerce.number().int().positive().default(50),
  COMPILE_QUOTA_PER_HOUR: z.coerce.number().int().positive().default(10),
  COMPILE_QUOTA_PER_DAY: z.coerce.number().int().positive().default(50),

  // File validation limits
  MAX_FILE_SIZE_MB: z.coerce.number().positive().default(5),
  MAX_PDF_PAGES: z.coerce.number().int().positive().default(10),

  // Text validation limits
  MIN_RESUME_LENGTH: z.coerce.number().int().positive().default(50),
  MAX_RESUME_LENGTH: z.coerce.number().int().positive().default(15_000),
  MIN_JD_LENGTH: z.coerce.number().int().positive().default(50),
  MAX_JD_LENGTH: z.coerce.number().int().positive().default(10_000),

  // Error tracking (optional - for production monitoring)
  SENTRY_DSN: z.string().optional(),
  ERROR_TRACKING_ENABLED: z.coerce.boolean().default(true),

  // Debug endpoint (optional - set to enable /health/errors)
  DEBUG_API_KEY: z.string().optional(),
});

// Clean all string env vars before validation (strip quotes, trailing slashes)
const cleanedEnv = {};
for (const [key, value] of Object.entries(process.env)) {
  const cleaned = typeof value === 'string' ? clean(value) : value;
  // Treat empty strings as undefined so optional() fields pass validation
  cleanedEnv[key] = cleaned === '' ? undefined : cleaned;
}

const parsed = schema.superRefine((data, ctx) => {
  const apiKey = data.NVIDIA_API_KEY || data.GEMINI_API_KEY || data.GOOGLE_API_KEY || data.AI_API_KEY;
  if (!apiKey) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['NVIDIA_API_KEY'],
      message: 'NVIDIA_API_KEY (or GEMINI_API_KEY / GOOGLE_API_KEY / AI_API_KEY) is required',
    });
  }
}).safeParse(cleanedEnv);

if (!parsed.success) {
  // Print which keys are wrong — but never their values (may be secret).
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  console.error(`\n[env] Invalid environment configuration:\n${issues}\n`);
  console.error('Set these as environment variables in your hosting dashboard (Render/Vercel/etc).\n');
  console.error('Required variables: PORT, NODE_ENV, FRONTEND_ORIGIN, SUPABASE_URL, SUPABASE_SECRET_KEY, NVIDIA_API_KEY (or GEMINI_API_KEY / GOOGLE_API_KEY / AI_API_KEY)\n');
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const aiConfig = {
  apiKey: env.NVIDIA_API_KEY || env.GEMINI_API_KEY || env.GOOGLE_API_KEY || env.AI_API_KEY,
  model: env.NVIDIA_MODEL || env.AI_MODEL || env.GEMINI_MODEL || 'deepseek-ai/deepseek-v4-pro-0813',
  baseUrl: env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
};
