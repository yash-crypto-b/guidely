import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
// Patch console FIRST so all subsequent logs are captured by the buffer.
import './common/logBuffer';
import { getLogEntries } from './common/logBuffer';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import prisma from './db';
import cron from 'node-cron';
import { sendBookingReminder } from './modules/notifications/service';

const app = express();

app.use(helmet());
const allowedOrigins = [
  config.frontend.appUrl,
  'http://localhost:3000',
  'http://localhost:3001',
  ...config.frontend.corsOrigins,
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({
  verify: (req: any, _res, buf) => {
    if (req.originalUrl === '/api/v1/payments/stripe/webhook') {
      req.rawBody = buf.toString();
    }
  },
}));

app.use(rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
}));

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: config.platform.name + ' API',
      version: '0.1.0',
      description: 'Open-source mentorship & booking platform API',
    },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/modules/**/*.ts'],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/v1', routes);
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── Keepalive endpoint ──────────────────────────────────────────────
// Ultra-lightweight — no DB query, no auth. Intended for external cron
// services (cron-job.org, UptimeRobot, etc.) to ping every 10 min and
// prevent Render free-tier spin-down.
app.get('/health/keepalive', (_req, res) => res.status(200).end());

// ─── Debug: recent error log buffer ───────────────────────────────
// Protected by a simple shared secret (set DEBUG_API_KEY in env).
// Query params:
//   ?level=error   — filter by level (info|warn|error)
//   ?limit=50      — max entries to return (default 50)
//   ?q=PUT         — substring filter on message text
app.get('/health/errors', (req, res) => {
  const key = (req.headers['x-debug-key'] as string) || (req.query.key as string);
  if (!config.debugApiKey || key !== config.debugApiKey) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  let entries = getLogEntries();

  const { level, q } = req.query as Record<string, string | undefined>;
  if (level) entries = entries.filter((e) => e.level === level);
  if (q) entries = entries.filter((e) => e.msg.includes(q));

  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const sliced = entries.slice(-limit);

  res.json({ count: sliced.length, entries: sliced });
});

app.use(errorHandler);

cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcoming = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        startTime: { gte: now, lte: in24Hours },
        OR: [
          { startTime: { gte: now, lte: inOneHour } },
          { startTime: { gte: in24Hours, lte: in24Hours } },
        ],
      },
    });

    for (const booking of upcoming) {
      const diff = booking.startTime.getTime() - now.getTime();
      if (diff <= 60 * 60 * 1000 || diff <= 24 * 60 * 60 * 1000) {
        await sendBookingReminder(booking.id);
      }
    }
  } catch (error) {
    console.error('Reminder cron failed:', error);
  }
});

async function start() {
  try {
    await prisma.$connect();
    console.log('Database connected');

    app.listen(config.port, config.host, () => {
      console.log(`${config.platform.name} API running on http://${config.host}:${config.port}`);
      console.log(`API docs: http://${config.host}:${config.port}/api-docs`);

      // ─── Self-ping keepalive (every 10 min) ───────────────────────
      // Helps prevent spin-down on platforms that monitor process activity.
      // External cron services (cron-job.org) should still be configured
      // for Render free-tier, since Render tracks *incoming HTTP traffic*.
      const KEEPALIVE_INTERVAL_MS = 10 * 60 * 1000;
      const selfUrl = `http://${config.host}:${config.port}/health/keepalive`;
      setInterval(async () => {
        try {
          await fetch(selfUrl, { signal: AbortSignal.timeout(5_000) });
        } catch {
          // Self-ping failure is non-fatal — just log it.
          console.warn('[keepalive] Self-ping failed');
        }
      }, KEEPALIVE_INTERVAL_MS);
      console.log(`[keepalive] Self-ping scheduled every ${KEEPALIVE_INTERVAL_MS / 60_000} min`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
