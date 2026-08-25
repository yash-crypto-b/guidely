import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getAnalyticsSummary } from '../lib/logger.js';
import { getUserQuotaStatus } from '../middleware/quota.js';
import { getCacheStats } from '../lib/cache.js';

export const statsRouter = Router();

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
