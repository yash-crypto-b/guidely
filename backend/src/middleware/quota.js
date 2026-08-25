/**
 * Usage Quota Middleware
 * Tracks per-user API usage and enforces quotas to control NVIDIA API costs.
 * Stores counts in Redis if available, otherwise in-memory Map.
 */

import { env } from '../config/env.js';

// ─── Storage Abstraction ────────────────────────────────────────────────
let redis = null;
let redisAvailable = false;
const memoryUsage = new Map(); // userId -> { count, resetsAt }

async function initRedis() {
  if (!env.REDIS_URL) return;
  try {
    const { default: Redis } = await import('ioredis');
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => (times > 2 ? null : Math.min(times * 200, 1000)),
      lazyConnect: true,
      connectTimeout: 3000,
    });
    await redis.connect();
    redisAvailable = true;
  } catch {
    redisAvailable = false;
  }
}

// ─── Quota Config ───────────────────────────────────────────────────────
const QUOTAS = {
  // Per-hour limits
  analysisPerHour: env.ANALYSIS_QUOTA_PER_HOUR || 20,  // ~20 analyses/hour
  cvPerHour: env.CV_QUOTA_PER_HOUR || 10,               // ~10 CV generations/hour
  compilePerHour: env.COMPILE_QUOTA_PER_HOUR || 10,      // ~10 PDF compilations/hour

  // Per-day limits
  analysisPerDay: env.ANALYSIS_QUOTA_PER_DAY || 100,
  cvPerDay: env.CV_QUOTA_PER_DAY || 50,
  compilePerDay: env.COMPILE_QUOTA_PER_DAY || 50,
};

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

// ─── Get Usage ──────────────────────────────────────────────────────────
async function getUsage(userId, action) {
  const now = Date.now();

  // Try Redis
  if (redisAvailable && redis) {
    try {
      const hourKey = `quota:${userId}:${action}:hour:${Math.floor(now / HOUR_MS)}`;
      const dayKey = `quota:${userId}:${action}:day:${Math.floor(now / DAY_MS)}`;

      const [hourCount, dayCount] = await Promise.all([
        redis.get(hourKey),
        redis.get(dayKey),
      ]);

      return {
        hour: parseInt(hourCount || '0', 10),
        day: parseInt(dayCount || '0', 10),
        hourTTL: HOUR_MS / 1000,
        dayTTL: DAY_MS / 1000,
      };
    } catch (err) {
      console.error('[quota] Redis get error:', err.message);
    }
  }

  // Fall back to memory
  const key = `${userId}:${action}`;
  const entry = memoryUsage.get(key) || { hour: {}, day: {} };

  const hourBucket = Math.floor(now / HOUR_MS);
  const dayBucket = Math.floor(now / DAY_MS);

  // Clean old buckets
  if (entry.hour.bucket !== hourBucket) {
    entry.hour = { bucket: hourBucket, count: 0 };
  }
  if (entry.day.bucket !== dayBucket) {
    entry.day = { bucket: dayBucket, count: 0 };
  }

  return { hour: entry.hour.count, day: entry.day.count };
}

// ─── Increment Usage ────────────────────────────────────────────────────
async function incrementUsage(userId, action) {
  const now = Date.now();

  // Try Redis
  if (redisAvailable && redis) {
    try {
      const hourKey = `quota:${userId}:${action}:hour:${Math.floor(now / HOUR_MS)}`;
      const dayKey = `quota:${userId}:${action}:day:${Math.floor(now / DAY_MS)}`;

      const pipeline = redis.pipeline();
      pipeline.incr(hourKey);
      pipeline.expire(hourKey, HOUR_MS / 1000);
      pipeline.incr(dayKey);
      pipeline.expire(dayKey, DAY_MS / 1000);
      await pipeline.exec();

      return;
    } catch (err) {
      console.error('[quota] Redis incr error:', err.message);
    }
  }

  // Fall back to memory
  const key = `${userId}:${action}`;
  const entry = memoryUsage.get(key) || { hour: {}, day: {} };

  const hourBucket = Math.floor(now / HOUR_MS);
  const dayBucket = Math.floor(now / DAY_MS);

  if (entry.hour.bucket !== hourBucket) {
    entry.hour = { bucket: hourBucket, count: 1 };
  } else {
    entry.hour.count++;
  }

  if (entry.day.bucket !== dayBucket) {
    entry.day = { bucket: dayBucket, count: 1 };
  } else {
    entry.day.count++;
  }

  memoryUsage.set(key, entry);
}

// ─── Middleware Factory ─────────────────────────────────────────────────
export function requireQuota(action) {
  return async (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) return next(); // Let auth middleware handle this

    const usage = await getUsage(userId, action);

    const hourlyLimit = QUOTAS[`${action}PerHour`] || QUOTAS.analysisPerHour;
    const dailyLimit = QUOTAS[`${action}PerDay`] || QUOTAS.analysisPerDay;

    if (usage.hour >= hourlyLimit) {
      console.log(`[quota] User ${userId} exceeded hourly ${action} limit: ${usage.hour}/${hourlyLimit}`);
      return res.status(429).json({
        error: `Hourly limit reached for ${action}. You can make ${hourlyLimit} requests per hour.`,
        retryAfter: '1 hour',
        usage: { hour: usage.hour, limit: hourlyLimit },
      });
    }

    if (usage.day >= dailyLimit) {
      console.log(`[quota] User ${userId} exceeded daily ${action} limit: ${usage.day}/${dailyLimit}`);
      return res.status(429).json({
        error: `Daily limit reached for ${action}. You can make ${dailyLimit} requests per day.`,
        retryAfter: 'tomorrow',
        usage: { day: usage.day, limit: dailyLimit },
      });
    }

    // Check remaining quota
    const hourlyRemaining = hourlyLimit - usage.hour;
    const dailyRemaining = dailyLimit - usage.day;

    // Set quota headers for client awareness
    res.set('X-Quota-Hourly-Remaining', String(hourlyRemaining));
    res.set('X-Quota-Daily-Remaining', String(dailyRemaining));

    // Increment usage (after check, so failed requests don't count)
    await incrementUsage(userId, action);

    next();
  };
}

// ─── Get User Quota Status ──────────────────────────────────────────────
export async function getUserQuotaStatus(userId) {
  const actions = ['analysis', 'cv', 'compile'];
  const status = {};

  for (const action of actions) {
    const usage = await getUsage(userId, action);
    status[action] = {
      hourly: {
        used: usage.hour,
        limit: QUOTAS[`${action}PerHour`] || QUOTAS.analysisPerHour,
      },
      daily: {
        used: usage.day,
        limit: QUOTAS[`${action}PerDay`] || QUOTAS.analysisPerDay,
      },
    };
  }

  return status;
}

// Initialize Redis on module load
initRedis();
