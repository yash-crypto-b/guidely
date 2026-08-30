import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
// Patch console FIRST so all subsequent logs are captured by the buffer.
import './lib/logBuffer.js';
import { env, isProd } from './config/env.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/error.js';
import { errorTrackingMiddleware } from './lib/errorTracker.js';
import { healthRouter } from './routes/health.js';
import { meRouter } from './routes/me.js';
import { analysisRouter } from './routes/analysis.js';
import { statsRouter } from './routes/stats.js';
import { connectionsRouter } from './routes/connections.js';
import { nvidiaCircuitBreaker } from './lib/circuitBreaker.js';
import { getAIServiceHealth } from './lib/ai.js';
import { errorTracker, ErrorCategory } from './lib/errorTracker.js';
import { getSecurityHeaders } from './lib/security.js';

function createCorsOriginChecker() {
  const configuredOrigins = env.FRONTEND_ORIGIN
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const allowedPatterns = [
    ...configuredOrigins.map((origin) => {
      try {
        return new URL(origin).origin;
      } catch {
        return origin;
      }
    }),
    /^https:\/\/.*\.vercel\.app$/i,
    /^http:\/\/localhost(?::\d+)?$/i,
    /^http:\/\/127\.0\.0\.1(?::\d+)?$/i,
  ];

  return (origin, callback) => {
    if (!origin) return callback(null, true);

    const allowed = allowedPatterns.some((pattern) => {
      if (pattern instanceof RegExp) return pattern.test(origin);
      return pattern === origin;
    });

    if (allowed) return callback(null, true);

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  };
}

// Build the Express app (no listen) so tests can import it without binding a port.
export function buildApp() {
  const app = express();

  app.disable('x-powered-by');
  // Behind a proxy in prod (Render/Fly/etc.) so rate-limit sees the real client IP.
  if (isProd) app.set('trust proxy', 1);

  // Error tracking middleware (must be early to catch all requests)
  app.use(errorTrackingMiddleware);

  // Enhanced security headers with helmet
  const securityConfig = getSecurityHeaders(isProd);
  app.use(helmet(securityConfig));

  // Strict CORS configuration
  app.use(cors({
    origin: createCorsOriginChecker(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id', 'X-Token-Expires-In', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'Retry-After'],
    maxAge: 86400, // 24 hours preflight cache
  }));

  app.use(express.json({ limit: '1mb' })); // bounded body — resume/JD files go via upload, not JSON

  // Health before the rate limiter — uptime pings shouldn't get throttled.
  app.use('/health', healthRouter);

  // Circuit breaker and AI service health endpoints (no auth needed for monitoring)
  app.get('/health/circuit', (req, res) => {
    res.json({
      status: 'ok',
      circuitBreaker: nvidiaCircuitBreaker.getMetrics(),
      aiService: getAIServiceHealth(),
    });
  });

  // Manual circuit breaker reset (admin only in production)
  app.post('/health/circuit/reset', (req, res) => {
    if (isProd && !req.headers['x-admin-secret']) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    nvidiaCircuitBreaker.reset();
    res.json({ message: 'Circuit breaker reset', state: nvidiaCircuitBreaker.getState() });
  });

  // Error summary endpoint (for monitoring)
  app.get('/health/errors', async (req, res) => {
    const hours = parseInt(req.query.hours) || 24;
    const summary = await errorTracker.getErrorSummary(hours);
    res.json(summary);
  });

  app.use(globalLimiter);

  // Protected routes — verify the Supabase JWT, derive the user from the token.
  app.use('/me', meRouter);
  app.use('/api/analyze', analysisRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api/v1/connections', connectionsRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
