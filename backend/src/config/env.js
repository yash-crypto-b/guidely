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

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  FRONTEND_ORIGIN: z.string().url(),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SECRET_KEY: z.string().min(1, 'SUPABASE_SECRET_KEY is required'),
  SUPABASE_JWT_SECRET: z.string().optional(),

  NVIDIA_API_KEY: z.string().min(1, 'NVIDIA_API_KEY is required'),
  NVIDIA_BASE_URL: z.string().url().default('https://integrate.api.nvidia.com/v1'),
  NVIDIA_MODEL: z.string().min(1),

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
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Print which keys are wrong — but never their values (may be secret).
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  console.error(`\n[env] Invalid environment configuration:\n${issues}\n`);
  console.error('Copy backend/.env.example to backend/.env and fill it in.\n');
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
