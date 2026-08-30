import { buildApp } from './app.js';
import { env } from './config/env.js';

const app = buildApp();

const server = app.listen(env.PORT, () => {
  console.log(`[guidely] API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);

  // ─── Self-ping keepalive (every 10 min) ────────────────────────
  const KEEPALIVE_INTERVAL_MS = 10 * 60 * 1000;
  const selfUrl = `http://localhost:${env.PORT}/health/keepalive`;
  setInterval(async () => {
    try {
      await fetch(selfUrl, { signal: AbortSignal.timeout(5_000) });
    } catch {
      console.warn('[keepalive] Self-ping failed');
    }
  }, KEEPALIVE_INTERVAL_MS);
  console.log(`[keepalive] Self-ping scheduled every ${KEEPALIVE_INTERVAL_MS / 60_000} min`);
});

// Extend timeouts for long-running AI generation requests (CV/cover letter can take 2+ min).
server.timeout = 5 * 60 * 1000;       // 5 min
server.headersTimeout = 60_000;
server.keepAliveTimeout = 65_000;

// Graceful shutdown so `node --watch` restarts and container stops don't leak the port.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
