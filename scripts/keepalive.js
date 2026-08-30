#!/usr/bin/env node

/**
 * Standalone keepalive script — pings the backend every 10 minutes to
 * prevent Render free-tier spin-down.
 *
 * Usage:
 *   node scripts/keepalive.js                          # uses default URL
 *   BACKEND_URL=https://guidely-1.onrender.com node scripts/keepalive.js
 *   INTERVAL_MS=600000 node scripts/keepalive.js       # default 10 min
 *
 * Deploy as:
 *   1. A cron job on any Linux server / VPS
 *   2. A free cron-job.org or UptimeRobot monitor
 *   3. A Render Background Worker service
 *   4. GitHub Actions scheduled workflow
 */

const BACKEND_URL = process.env.BACKEND_URL || 'https://guidely-1.onrender.com';
const KEEPALIVE_PATH = '/health/keepalive';
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS || '600000', 10); // 10 min

const url = `${BACKEND_URL}${KEEPALIVE_PATH}`;

async function ping() {
  const ts = new Date().toISOString();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    console.log(`[${ts}] ${res.status} ${res.ok ? 'OK' : 'UNEXPECTED'}`);
  } catch (err) {
    console.error(`[${ts}] FAILED: ${err.message}`);
  }
}

console.log(`[keepalive] Pinging ${url} every ${INTERVAL_MS / 1000}s`);
ping(); // immediate first ping
setInterval(ping, INTERVAL_MS);
