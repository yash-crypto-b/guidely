/**
 * In-memory circular log buffer.
 *
 * Intercepts console.error / console.warn and stores entries that match
 * interesting keywords (profile errors, Supabase failures, etc.).  The
 * /health/errors endpoint reads from this buffer — no SSH required.
 */

export interface LogEntry {
  ts: string;
  level: 'info' | 'warn' | 'error';
  msg: string;
}

const MAX_ENTRIES = 200;
const entries: LogEntry[] = [];

// Keywords that indicate a request-level error worth surfacing.
const CAPTURE_PATTERNS = [
  '[PUT /profile]',
  '[GET /profile]',
  '[POST /services]',
  'Profile update error',
  'Failed to',
  'Prisma',
  'PGRST',
  '401',
  '403',
  '404',
  '500',
  'Unhandled error',
];

function matchesCapture(msg: string): boolean {
  return CAPTURE_PATTERNS.some((p) => msg.includes(p));
}

function capture(level: LogEntry['level'], args: unknown[]): void {
  const msg = args
    .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
    .join(' ');
  if (!matchesCapture(msg)) return;

  entries.push({ ts: new Date().toISOString(), level, msg });
  if (entries.length > MAX_ENTRIES) entries.shift();
}

// Wrap console methods — call the originals so Render logs still work.
const _error = console.error;
const _warn = console.warn;
const _log = console.log;

console.error = (...args: unknown[]) => { capture('error', args); _error.apply(console, args); };
console.warn = (...args: unknown[]) => { capture('warn', args); _warn.apply(console, args); };
console.log = (...args: unknown[]) => { capture('info', args); _log.apply(console, args); };

/** Return a shallow copy of the buffered entries (newest last). */
export function getLogEntries(): LogEntry[] {
  return [...entries];
}

/** Clear the buffer (useful for tests). */
export function clearLogBuffer(): void {
  entries.length = 0;
}
