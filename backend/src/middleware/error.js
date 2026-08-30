import { isProd } from '../config/env.js';
import { errorTracker, ErrorCategory, Severity } from '../lib/errorTracker.js';

// 404 for unmatched routes.
export function notFound(_req, res, _next) {
  res.status(404).json({ error: 'Not found' });
}

// Central error handler.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;

  // Determine severity
  let severity = Severity.ERROR;
  if (status >= 500) severity = Severity.ERROR;
  else if (status === 429) severity = Severity.WARNING;
  else severity = Severity.INFO;

  // Determine category
  let category = ErrorCategory.INTERNAL;
  if (err.isCircuitBreakerError) category = ErrorCategory.AI_SERVICE;
  else if (status === 401 || status === 403) category = ErrorCategory.AUTH;
  else if (status === 429) category = ErrorCategory.RATE_LIMIT;
  else if (status === 400) category = ErrorCategory.VALIDATION;
  else if (err.name === 'TimeoutError' || err.code === 'ETIMEDOUT') category = ErrorCategory.TIMEOUT;

  // Capture error with context
  errorTracker.captureError(err, {
    severity,
    category,
    userId: req.user?.id,
    requestId: req.requestId,
    extra: {
      statusCode: status,
      method: req.method,
      path: req.path,
      userAgent: req.headers['user-agent'],
    },
    tags: {
      'error.type': err.name,
      'error.code': err.code,
    },
  });

  // Log full details server-side
  if (status >= 500) {
    console.error(`[error] ${status} ${err.message}`);
    if (!isProd) console.error(err.stack);
  } else {
    console.error(`[error] ${status} ${err.message}`);
  }

  // Determine client message
  let message;
  if (status < 500 && err.message) {
    // 4xx: always show the message (validation errors, not-found, etc.)
    message = err.message;
  } else if (isProd) {
    // 5xx in production: safe generic message, but include requestId for debugging
    message = 'Something went wrong on our end. Please try again in a moment.';
  } else {
    // 5xx in development: show the real error for debugging
    message = err.message || 'Internal server error';
  }

  res.status(status).json({
    error: message,
    // Include the error name so frontend can distinguish error types
    code: err.name || 'UNKNOWN_ERROR',
    requestId: req.requestId,
    ...(isProd ? {} : { 
      _debug: { 
        status, 
        type: err.name, 
        code: err.code,
        circuitState: err.circuitState,
      } 
    }),
  });
}
