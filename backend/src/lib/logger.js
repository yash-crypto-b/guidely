/**
 * Structured Logger for Analytics
 * Logs analysis results with scoring data for debugging and analytics.
 */

import { appendFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_DIR = join(__dirname, '../../logs');
const LOG_FILE = join(LOG_DIR, 'analytics.jsonl');

// Ensure log directory exists
mkdir(LOG_DIR, { recursive: true }).catch(() => {});

// ─── Log Entry Types ────────────────────────────────────────────────────
const EVENT_TYPES = {
  ANALYSIS_COMPLETE: 'analysis_complete',
  ANALYSIS_FAILED: 'analysis_failed',
  CV_GENERATED: 'cv_generated',
  CV_FAILED: 'cv_failed',
  PDF_PARSED: 'pdf_parsed',
  PDF_FAILED: 'pdf_failed',
  CACHE_HIT: 'cache_hit',
  CACHE_MISS: 'cache_miss',
  QUOTA_EXCEEDED: 'quota_exceeded',
  AI_RETRY: 'ai_retry',
  AI_FALLBACK: 'ai_fallback',
};

// ─── Core Logger ────────────────────────────────────────────────────────
async function writeLog(entry) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
  };

  // Console output in development
  if (process.env.NODE_ENV !== 'production') {
    const { timestamp, type, userId, score, ...rest } = logEntry;
    console.log(`[analytics] ${type}:`, { userId, score, ...rest });
  }

  // Write to file (JSONL format for easy querying)
  try {
    await appendFile(LOG_FILE, JSON.stringify(logEntry) + '\n');
  } catch (err) {
    // Don't let logging failures break the app
    console.error('[analytics] Write failed:', err.message);
  }
}

// ─── Analysis Logging ───────────────────────────────────────────────────
export async function logAnalysisComplete({ userId, jobDescriptionLength, resumeLength, result, durationMs, cached }) {
  await writeLog({
    type: EVENT_TYPES.ANALYSIS_COMPLETE,
    userId,
    jobDescriptionLength,
    resumeLength,
    score: result.ats_score,
    breakdown: result.score_breakdown,
    recommendation: result.recommendation,
    durationMs,
    cached,
  });
}

export async function logAnalysisFailed({ userId, error, durationMs }) {
  await writeLog({
    type: EVENT_TYPES.ANALYSIS_FAILED,
    userId,
    error: error.message || String(error),
    durationMs,
  });
}

export async function logCVGenerated({ userId, latexLength, durationMs }) {
  await writeLog({
    type: EVENT_TYPES.CV_GENERATED,
    userId,
    latexLength,
    durationMs,
  });
}

export async function logCVFailed({ userId, error, durationMs }) {
  await writeLog({
    type: EVENT_TYPES.CV_FAILED,
    userId,
    error: error.message || String(error),
    durationMs,
  });
}

export async function logPDFParsed({ userId, method, charsExtracted, fileSize }) {
  await writeLog({
    type: EVENT_TYPES.PDF_PARSED,
    userId,
    method,
    charsExtracted,
    fileSize,
  });
}

export async function logPDFFailed({ userId, error, fileSize }) {
  await writeLog({
    type: EVENT_TYPES.PDF_FAILED,
    userId,
    error: error.message || String(error),
    fileSize,
  });
}

export async function logCacheHit({ userId, key }) {
  await writeLog({
    type: EVENT_TYPES.CACHE_HIT,
    userId,
    key,
  });
}

export async function logCacheMiss({ userId, key }) {
  await writeLog({
    type: EVENT_TYPES.CACHE_MISS,
    userId,
    key,
  });
}

export async function logQuotaExceeded({ userId, action, usage, limit }) {
  await writeLog({
    type: EVENT_TYPES.QUOTA_EXCEEDED,
    userId,
    action,
    usage,
    limit,
  });
}

export async function logAIRetry({ userId, attempt, model, status }) {
  await writeLog({
    type: EVENT_TYPES.AI_RETRY,
    userId,
    attempt,
    model,
    status,
  });
}

export async function logAIFallback({ userId, fromModel, toModel, reason }) {
  await writeLog({
    type: EVENT_TYPES.AI_FALLBACK,
    userId,
    fromModel,
    toModel,
    reason,
  });
}

// ─── Analytics Queries ──────────────────────────────────────────────────
import { readFile } from 'node:fs/promises';

export async function getAnalyticsSummary({ hours = 24 } = {}) {
  try {
    const content = await readFile(LOG_FILE, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const cutoff = Date.now() - hours * 3_600_000;

    let totalAnalyses = 0;
    let successfulAnalyses = 0;
    let failedAnalyses = 0;
    let totalScore = 0;
    let scoreDistribution = { apply: 0, tailor: 0, skip: 0 };
    let avgDurationMs = 0;
    let totalDurationMs = 0;
    let cacheHits = 0;
    let cacheMisses = 0;
    let uniqueUsers = new Set();
    let lowScoreReasons = [];

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        const entryTime = new Date(entry.timestamp).getTime();
        if (entryTime < cutoff) continue;

        uniqueUsers.add(entry.userId);

        if (entry.type === EVENT_TYPES.ANALYSIS_COMPLETE) {
          totalAnalyses++;
          successfulAnalyses++;
          totalScore += entry.score;
          totalDurationMs += entry.durationMs || 0;

          if (entry.recommendation) {
            scoreDistribution[entry.recommendation]++;
          }

          // Track low scores for prompt quality debugging
          if (entry.score < 50) {
            lowScoreReasons.push({
              userId: entry.userId,
              score: entry.score,
              breakdown: entry.breakdown,
            });
          }
        }

        if (entry.type === EVENT_TYPES.ANALYSIS_FAILED) {
          totalAnalyses++;
          failedAnalyses++;
        }

        if (entry.type === EVENT_TYPES.CACHE_HIT) cacheHits++;
        if (entry.type === EVENT_TYPES.CACHE_MISS) cacheMisses++;
      } catch {
        // Skip malformed lines
      }
    }

    return {
      period: `Last ${hours} hours`,
      analyses: {
        total: totalAnalyses,
        successful: successfulAnalyses,
        failed: failedAnalyses,
        successRate: totalAnalyses > 0 ? ((successfulAnalyses / totalAnalyses) * 100).toFixed(1) + '%' : 'N/A',
      },
      scoring: {
        averageScore: successfulAnalyses > 0 ? Math.round(totalScore / successfulAnalyses) : 0,
        distribution: scoreDistribution,
      },
      performance: {
        avgDurationMs: successfulAnalyses > 0 ? Math.round(totalDurationMs / successfulAnalyses) : 0,
      },
      caching: {
        hits: cacheHits,
        misses: cacheMisses,
        hitRate: (cacheHits + cacheMisses) > 0
          ? ((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(1) + '%'
          : 'N/A',
      },
      users: {
        unique: uniqueUsers.size,
      },
      lowScores: {
        count: lowScoreReasons.length,
        samples: lowScoreReasons.slice(0, 10), // Last 10 low scores
      },
    };
  } catch {
    return { error: 'No analytics data available yet' };
  }
}

export { EVENT_TYPES };
