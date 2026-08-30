import { Router } from 'express';
import { env } from '../config/env.js';
import { getLogEntries } from '../lib/logBuffer.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Ultra-lightweight keepalive — no body, no DB, no auth.
// Ping this from an external cron service every 10 min.
healthRouter.get('/keepalive', (_req, res) => res.status(200).end());

// ─── Debug: recent error log buffer ───────────────────────────────────
// Protected by a simple shared secret (set DEBUG_API_KEY in env).
// Query params:
//   ?level=error   — filter by level (info|warn|error)
//   ?limit=50      — max entries to return (default 50)
//   ?q=PUT         — substring filter on message text
healthRouter.get('/errors', (req, res) => {
  const key = req.headers['x-debug-key'] || req.query.key;
  if (!env.DEBUG_API_KEY || key !== env.DEBUG_API_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  let entries = getLogEntries();

  const { level, q } = req.query;
  if (level) entries = entries.filter((e) => e.level === level);
  if (q) entries = entries.filter((e) => e.msg.includes(q));

  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const sliced = entries.slice(-limit);

  res.json({ count: sliced.length, entries: sliced });
});
