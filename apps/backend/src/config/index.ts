import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://guidely:guidely@localhost:5432/guidely',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    issuer: process.env.JWT_ISSUER || 'guidely',
  },

  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    jwtSecret: process.env.SUPABASE_JWT_SECRET || '',
  },

  debugApiKey: process.env.DEBUG_API_KEY || '',

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/google/callback',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    connectClientId: process.env.STRIPE_CONNECT_CLIENT_ID || '',
  },

  platform: {
    feePercent: parseInt(process.env.PLATFORM_FEE_PERCENT || '0', 10),
    name: process.env.PLATFORM_NAME || 'Guidely',
    url: process.env.PLATFORM_URL || 'http://localhost:3000',
    supportEmail: process.env.PLATFORM_SUPPORT_EMAIL || 'hello@guidely.dev',
  },

  video: {
    provider: process.env.VIDEO_PROVIDER || 'jitsi',
    jitsiDomain: process.env.JITSI_DOMAIN || 'meet.jit.si',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@guidely.dev',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  frontend: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [],
  },
};
