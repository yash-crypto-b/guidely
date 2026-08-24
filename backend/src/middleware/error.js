import { isProd } from '../config/env.js';

// 404 for unmatched routes.
export function notFound(_req, res, _next) {
  res.status(404).json({ error: 'Not found' });
}

// Central error handler. Generic message to the client; full detail server-side.
// Never leak stack traces, secrets, or PII to the response body.
// eslint-disable-next-line no-unused-vars -- Express needs the 4-arg signature
export function errorHandler(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500;

  // Log server-side. Avoid dumping request bodies (may contain resume/JD/PII).
  if (status >= 500) {
    console.error(`[error] ${status} ${err.message}`, isProd ? '' : err.stack);
  }

  // Client-safe message: pass through intentional 4xx messages, hide 5xx detail.
  const message =
    status < 500 && err.message ? err.message : 'Something went wrong. Please try again.';
  res.status(status).json({ error: message });
}
