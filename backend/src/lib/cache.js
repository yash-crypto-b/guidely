import { createHash } from 'node:crypto';
import { env } from '../config/env.js';
import { normalizeForCache } from './security.js';

/**
 * Cache abstraction layer.
 * - Tries Redis first if REDIS_URL is set
 * - Falls back to in-memory Map (single-instance only)
 * - Uses normalized keys to prevent cache poisoning
 */

const DEFAULT_TTL_SECONDS = 3600; // 1 hour
const MAX_MEMORY_CACHE_SIZE = 500;

// ─── In-Memory Cache (fallback) ─────────────────────────────────────────
const memoryCache = new Map();

function memoryGet(key) {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > DEFAULT_TTL_SECONDS * 1000) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
}

function memorySet(key, value, ttlSeconds = DEFAULT_TTL_SECONDS) {
  if (memoryCache.size >= MAX_MEMORY_CACHE_SIZE) {
    const oldestKey = memoryCache.keys().next().value;
    memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, { value, timestamp: Date.now(), ttl: ttlSeconds });
}

function memoryDel(key) {
  memoryCache.delete(key);
}

function memoryStats() {
  let valid = 0;
  let expired = 0;
  for (const [, entry] of memoryCache) {
    if (Date.now() - entry.timestamp > (entry.ttl || DEFAULT_TTL_SECONDS) * 1000) {
      expired++;
    } else {
      valid++;
    }
  }
  return { type: 'memory', totalEntries: memoryCache.size, validEntries: valid, expiredEntries: expired };
}

// ─── Redis Cache (primary) ──────────────────────────────────────────────
let redis = null;
let redisAvailable = false;

async function initRedis() {
  if (!env.REDIS_URL) {
    console.log('[cache] No REDIS_URL set, using in-memory cache');
    return;
  }

  try {
    // Dynamic import so the app works without ioredis installed
    const { default: Redis } = await import('ioredis');
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null; // Stop retrying
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
      connectTimeout: 5000,
    });

    await redis.connect();
    redisAvailable = true;
    console.log('[cache] Redis connected successfully');

    redis.on('error', (err) => {
      console.error('[cache] Redis error:', err.message);
      redisAvailable = false;
    });

    redis.on('reconnecting', () => {
      console.log('[cache] Redis reconnecting...');
    });

    redis.on('ready', () => {
      redisAvailable = true;
      console.log('[cache] Redis ready');
    });
  } catch (err) {
    console.error('[cache] Redis connection failed:', err.message, '- falling back to in-memory');
    redisAvailable = false;
  }
}

async function redisGet(key) {
  if (!redisAvailable || !redis) return null;
  try {
    const data = await redis.get(`guidely:${key}`);
    if (!data) return null;
    return JSON.parse(data);
  } catch (err) {
    console.error('[cache] Redis get error:', err.message);
    return null;
  }
}

async function redisSet(key, value, ttlSeconds = DEFAULT_TTL_SECONDS) {
  if (!redisAvailable || !redis) return;
  try {
    await redis.setex(`guidely:${key}`, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error('[cache] Redis set error:', err.message);
  }
}

async function redisDel(key) {
  if (!redisAvailable || !redis) return;
  try {
    await redis.del(`guidely:${key}`);
  } catch (err) {
    console.error('[cache] Redis del error:', err.message);
  }
}

async function redisStats() {
  if (!redisAvailable || !redis) return null;
  try {
    const keys = await redis.keys('guidely:*');
    return { type: 'redis', totalEntries: keys.length, connected: true };
  } catch {
    return { type: 'redis', totalEntries: -1, connected: false };
  }
}

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Generate normalized cache key from job description and resume text.
 * Prevents cache poisoning through trivial variations (case, whitespace, etc.)
 */
export function generateKey(jobDescription, resumeText) {
  // Normalize inputs to prevent poisoning
  const normalizedJD = normalizeForCache(jobDescription);
  const normalizedResume = normalizeForCache(resumeText);
  
  const combined = `${normalizedJD}|||${normalizedResume}`;
  return createHash('sha256').update(combined).digest('hex').slice(0, 16);
}

export async function getCachedResult(jobDescription, resumeText) {
  const key = generateKey(jobDescription, resumeText);

  // Try Redis first
  const redisResult = await redisGet(key);
  if (redisResult) {
    console.log(`[cache] Redis hit: ${key}`);
    return redisResult;
  }

  // Fall back to memory
  const memResult = memoryGet(key);
  if (memResult) {
    console.log(`[cache] Memory hit: ${key}`);
    return memResult;
  }

  return null;
}

export async function setCachedResult(jobDescription, resumeText, result, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const key = generateKey(jobDescription, resumeText);

  // Store in both
  await redisSet(key, result, ttlSeconds);
  memorySet(key, result, ttlSeconds);

  console.log(`[cache] Stored: ${key}`);
}

export async function clearCache() {
  memoryCache.clear();
  if (redisAvailable && redis) {
    const keys = await redis.keys('guidely:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
  console.log('[cache] Cleared all entries');
  return 'Cache cleared';
}

export async function getCacheStats() {
  const memStats = memoryStats();
  const redisStatsData = await redisStats();
  return {
    memory: memStats,
    redis: redisStatsData,
    ttlSeconds: DEFAULT_TTL_SECONDS,
  };
}

// Initialize Redis on module load (non-blocking)
initRedis();
