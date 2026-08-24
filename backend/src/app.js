import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env, isProd } from './config/env.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/error.js';
import { healthRouter } from './routes/health.js';
import { meRouter } from './routes/me.js';

// Build the Express app (no listen) so tests can import it without binding a port.
export function buildApp() {
  const app = express();

  app.disable('x-powered-by');
  // Behind a proxy in prod (Render/Fly/etc.) so rate-limit sees the real client IP.
  if (isProd) app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_ORIGIN })); // strict allowlist: only the frontend
  app.use(express.json({ limit: '1mb' })); // bounded body — resume/JD files go via upload, not JSON

  // Health before the rate limiter — uptime pings shouldn't get throttled.
  app.use('/health', healthRouter);

  app.use(globalLimiter);

  // Protected routes — verify the Supabase JWT, derive the user from the token.
  app.use('/me', meRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
