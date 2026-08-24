import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

// Load backend/.env if it exists (absolute path, so it works regardless of the
// process cwd). In production, env comes from the platform and no file is needed.
const envPath = join(import.meta.dirname, '../../.env');
if (existsSync(envPath)) process.loadEnvFile(envPath);

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
