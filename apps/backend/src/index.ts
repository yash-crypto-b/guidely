import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
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
