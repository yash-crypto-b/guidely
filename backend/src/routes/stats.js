import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getAnalyticsSummary } from '../lib/logger.js';
import { getUserQuotaStatus } from '../middleware/quota.js';
import { getCacheStats } from '../lib/cache.js';

export const statsRouter = Router();

// In-memory history per user (resets on server restart)
const userHistory = new Map();

export function recordAnalysis(userId, entry) {
  if (!userId) return;
  if (!userHistory.has(userId)) userHistory.set(userId, []);
  const list = userHistory.get(userId);
  list.unshift(entry);
  if (list.length > 50) list.length = 50; // keep last 50
}

// GET /api/stats/history — Get user's analysis history
statsRouter.get('/history', requireAuth, async (req, res) => {
  try {
    const history = userHistory.get(req.user.id) || [];
    res.json({ history });
  } catch (err) {
    console.error('[stats] History error:', err.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// GET /api/stats — Get analytics summary
statsRouter.get('/', requireAuth, async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const summary = await getAnalyticsSummary({ hours });
    res.json(summary);
  } catch (err) {
    console.error('[stats] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/stats/quota — Get current user's quota status
statsRouter.get('/quota', requireAuth, async (req, res) => {
  try {
    const status = await getUserQuotaStatus(req.user.id);
    res.json(status);
  } catch (err) {
    console.error('[stats] Quota error:', err.message);
    res.status(500).json({ error: 'Failed to fetch quota' });
  }
});

// GET /api/stats/cache — Get cache statistics
statsRouter.get('/cache', requireAuth, async (req, res) => {
  try {
    const stats = await getCacheStats();
    res.json(stats);
  } catch (err) {
    console.error('[stats] Cache error:', err.message);
    res.status(500).json({ error: 'Failed to fetch cache stats' });
  }
});
