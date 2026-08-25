/**
 * Structured Error Tracking
 * Provides error reporting, context, and metrics without requiring external services.
 * Can be extended to integrate with Sentry, Datadog, etc.
 */

import { appendFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env, isProd } from '../config/env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_DIR = join(__dirname, '../../logs');
const ERROR_LOG_FILE = join(LOG_DIR, 'errors.jsonl');

// Ensure log directory exists
mkdir(LOG_DIR, { recursive: true }).catch(() => {});

// ─── Error Severity Levels ──────────────────────────────────────────────
export const Severity = {
  FATAL: 'fatal',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// ─── Error Categories ───────────────────────────────────────────────────
export const ErrorCategory = {
  AUTH: 'authentication',
  AI_SERVICE: 'ai_service',
  DATABASE: 'database',
  VALIDATION: 'validation',
  RATE_LIMIT: 'rate_limit',
  EXTERNAL_API: 'external_api',
  INTERNAL: 'internal',
  TIMEOUT: 'timeout',
};

// ─── Error Tracker Class ────────────────────────────────────────────────
class ErrorTracker {
  constructor() {
    this.breadcrumbs = [];
    this.maxBreadcrumbs = 50;
    this.context = {};
    this.metrics = {
      errors: 0,
      warnings: 0,
      byCategory: {},
      bySeverity: {},
    };
  }

  // Set global context (user, environment, etc.)
  setContext(key, value) {
    this.context[key] = value;
  }

  // Clear context
  clearContext() {
    this.context = {};
  }

  // Add breadcrumb for debugging trail
  addBreadcrumb(category, message, data = {}) {
    this.breadcrumbs.push({
      timestamp: new Date().toISOString(),
      category,
      message,
      data,
    });

    // Keep only recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  // Capture an error
  async captureError(error, options = {}) {
    const {
      severity = Severity.ERROR,
      category = ErrorCategory.INTERNAL,
      userId = null,
      requestId = null,
      extra = {},
      tags = {},
    } = options;

    // Update metrics
    this.metrics.errors++;
    this.metrics.byCategory[category] = (this.metrics.byCategory[category] || 0) + 1;
    this.metrics.bySeverity[severity] = (this.metrics.bySeverity[severity] || 0) + 1;

    // Build error report
    const report = {
      timestamp: new Date().toISOString(),
      severity,
      category,
      error: {
        name: error.name,
        message: error.message,
        stack: isProd ? undefined : error.stack, // Only in dev
        code: error.code,
      },
      context: { ...this.context },
      breadcrumbs: [...this.breadcrumbs],
      extra,
      tags,
      userId,
      requestId,
      environment: env.NODE_ENV,
      hostname: process.env.HOSTNAME || 'unknown',
    };

    // Log to file
    await this.writeReport(report);

    // Console output based on severity
    if (severity === Severity.FATAL || severity === Severity.ERROR) {
      console.error(`[errorTracker] ${severity.toUpperCase()} [${category}]:`, error.message);
      if (!isProd && error.stack) {
        console.error(error.stack);
      }
    } else if (severity === Severity.WARNING) {
      console.warn(`[errorTracker] WARNING [${category}]:`, error.message);
    }

    // Clear breadcrumbs after capture
    this.breadcrumbs = [];

    return report;
  }

  // Capture a message (not an error)
  async captureMessage(message, severity = Severity.INFO, options = {}) {
    const report = {
      timestamp: new Date().toISOString(),
      severity,
      message,
      context: { ...this.context },
      breadcrumbs: [...this.breadcrumbs],
      ...options,
    };

    await this.writeReport(report);
    this.breadcrumbs = [];

    return report;
  }

  // Write report to file
  async writeReport(report) {
    try {
      await appendFile(ERROR_LOG_FILE, JSON.stringify(report) + '\n');
    } catch (err) {
      // Don't let logging failures break the app
      console.error('[errorTracker] Failed to write report:', err.message);
    }
  }

  // Get error metrics
  getMetrics() {
    return { ...this.metrics };
  }

  // Get recent errors
  async getRecentErrors(limit = 50) {
    try {
      const { readFile } = await import('node:fs/promises');
      const content = await readFile(ERROR_LOG_FILE, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      return lines
        .slice(-limit)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .reverse();
    } catch {
      return [];
    }
  }

  // Get error summary for health checks
  async getErrorSummary(hours = 24) {
    try {
      const { readFile } = await import('node:fs/promises');
      const content = await readFile(ERROR_LOG_FILE, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      const cutoff = Date.now() - hours * 3_600_000;

      let total = 0;
      let byCategory = {};
      let bySeverity = {};

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          const entryTime = new Date(entry.timestamp).getTime();
          if (entryTime < cutoff) continue;

          total++;
          byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
          bySeverity[entry.severity] = (bySeverity[entry.severity] || 0) + 1;
        } catch {
          // Skip malformed lines
        }
      }

      return {
        period: `Last ${hours} hours`,
        totalErrors: total,
        byCategory,
        bySeverity,
      };
    } catch {
      return { error: 'No error data available' };
    }
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();

// ─── Express Middleware ─────────────────────────────────────────────────
export function errorTrackingMiddleware(req, res, next) {
  // Generate request ID if not present
  const requestId = req.headers['x-request-id'] || 
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  // Set context for this request
  errorTracker.setContext('requestId', requestId);
  errorTracker.setContext('method', req.method);
  errorTracker.setContext('path', req.path);
  errorTracker.setContext('ip', req.ip);

  // Add breadcrumb
  errorTracker.addBreadcrumb('http', `${req.method} ${req.path}`, {
    query: req.query,
    userAgent: req.headers['user-agent'],
  });

  // Capture response errors
  const originalSend = res.send;
  res.send = function(body) {
    if (res.statusCode >= 400) {
      errorTracker.addBreadcrumb('http', `Response ${res.statusCode}`, {
        path: req.path,
      });
    }
    return originalSend.call(this, body);
  };

  next();
}

// ─── Global Error Handler ───────────────────────────────────────────────
export function globalErrorHandler(err, req, res, _next) {
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

  // Capture error
  errorTracker.captureError(err, {
    severity,
    category,
    userId: req.user?.id,
    requestId: req.requestId,
    extra: {
      statusCode: status,
      method: req.method,
      path: req.path,
    },
    tags: {
      'error.type': err.name,
      'error.code': err.code,
    },
  });

  // Send response
  let message;
  if (status < 500 && err.message) {
    message = err.message;
  } else if (isProd) {
    message = 'Something went wrong on our end. Please try again in a moment.';
  } else {
    message = err.message || 'Internal server error';
  }

  res.status(status).json({
    error: message,
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

export default errorTracker;
