/**
 * Per-User Rate Limiting Middleware
 * Provides rate limiting based on authenticated user ID, not just IP.
 * This prevents auth abuse where one account spams endpoints.
 */

import { env } from '../config/env.js';

// ─── Storage Abstraction ────────────────────────────────────────────────
let redis = null;
let redisAvailable = false;
const memoryStore = new Map(); // userId -> { requests: [{timestamp}], windowMs }

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

// ─── Sliding Window Counter ─────────────────────────────────────────────
async function isRateLimited(userId, action, maxRequests, windowMs) {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Try Redis
  if (redisAvailable && redis) {
    try {
      const key = `ratelimit:${userId}:${action}`;
      
      // Use sorted set for sliding window
      await redis.zremrangebyscore(key, 0, windowStart);
      
      const count = await redis.zcard(key);
      
      if (count >= maxRequests) {
        // Get oldest request to calculate retry-after
        const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
        const retryAfter = oldest.length > 0 
          ? Math.ceil((parseInt(oldest[1]) + windowMs - now) / 1000)
          : Math.ceil(windowMs / 1000);
        
        return { limited: true, retryAfter, count };
      }
      
      // Add current request
      await redis.zadd(key, now, `${now}-${Math.random().toString(36).slice(2)}`);
      await redis.expire(key, Math.ceil(windowMs / 1000));
      
      return { limited: false, retryAfter: 0, count: count + 1 };
    } catch (err) {
      console.error('[userRateLimit] Redis error:', err.message);
    }
  }

  // Fall back to memory
  const key = `${userId}:${action}`;
  const entry = memoryStore.get(key) || { requests: [] };
  
  // Remove old requests
  entry.requests = entry.requests.filter(ts => ts > windowStart);
  
  if (entry.requests.length >= maxRequests) {
    const oldest = Math.min(...entry.requests);
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    memoryStore.set(key, entry);
    return { limited: true, retryAfter, count: entry.requests.length };
  }
  
  entry.requests.push(now);
  memoryStore.set(key, entry);
  
  return { limited: false, retryAfter: 0, count: entry.requests.length };
}

// ─── Rate Limit Configurations ──────────────────────────────────────────
const RATE_LIMITS = {
  // Strict limits for expensive AI operations
  analysis: {
    maxRequests: 10,
    windowMs: 60_000, // 1 minute
  },
  cv: {
    maxRequests: 5,
    windowMs: 60_000,
  },
  coverLetter: {
    maxRequests: 5,
    windowMs: 60_000,
  },
  compile: {
    maxRequests: 5,
    windowMs: 60_000,
  },
  
  // Moderate limits for other authenticated endpoints
  default: {
    maxRequests: 30,
    windowMs: 60_000, // 30 requests per minute
  },
};

// ─── Middleware Factory ─────────────────────────────────────────────────
export function requireUserRateLimit(action = 'default') {
  return async (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) return next(); // Let auth middleware handle this

    const config = RATE_LIMITS[action] || RATE_LIMITS.default;
    const { limited, retryAfter, count } = await isRateLimited(
      userId,
      action,
      config.maxRequests,
      config.windowMs
    );

    if (limited) {
      console.log(`[userRateLimit] User ${userId} exceeded ${action} limit: ${count}/${config.maxRequests}`);
      
      res.set('Retry-After', String(retryAfter));
      res.set('X-RateLimit-Limit', String(config.maxRequests));
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', String(Math.ceil((Date.now() + retryAfter * 1000) / 1000)));
      
      return res.status(429).json({
        error: `Rate limit exceeded for ${action}. Please wait ${retryAfter} seconds.`,
        retryAfter,
        limit: config.maxRequests,
        remaining: 0,
      });
    }

    // Set rate limit headers for client awareness
    res.set('X-RateLimit-Limit', String(config.maxRequests));
    res.set('X-RateLimit-Remaining', String(config.maxRequests - count));
    
    next();
  };
}

// Initialize Redis on module load
initRedis();
