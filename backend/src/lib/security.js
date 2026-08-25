/**
 * Security Utilities
 * Centralized security functions for input sanitization, prompt injection defense,
 * filename sanitization, and cache key normalization.
 */

// ─── Prompt Injection Defense ────────────────────────────────────────────

// Patterns that indicate prompt injection attempts (more conservative)
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/gi,
  /disregard\s+(all\s+)?prior\s+commands/gi,
  /you\s+are\s+now\s+a/gi,
  /act\s+as\s+if\s+you\s+are/gi,
  /pretend\s+you\s+are/gi,
  /forget\s+(all\s+)?your\s+instructions/gi,
  /new\s+instructions?:/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<<SYS>>/gi,
  /\b(os|model):\s*/gi,
  /\bname:\s*(assistant|system|user)/gi,
  /\bdo\s+not\s+follow\b/gi,
  /\binstead\s+of\s+following\b/gi,
  /\boverride\b.*\binstructions\b/gi,
  /\bwrite\s+code\b.*\bignore\b/gi,
  /\bexec(ute)?\s*\(/gi,
  /\bsystem\s+prompt\b/gi,
  /\byour\s+system\s+prompt\b/gi,
];

// Suspicious patterns in LaTeX output
const LATEX_DANGEROUS_PATTERNS = [
  /\\write18/gi,           // Shell escape
  /\\immediate/gi,         // Immediate execution
  /\\input\{/gi,           // File inclusion
  /\\include\{/gi,         // File inclusion
  /\\verbatiminput/gi,     // File inclusion
  /\\shellcmd/gi,          // Shell command
  /\\syscmd/gi,            // System command
  /\\writefile/gi,         // File writing
];

/**
 * Detect prompt injection attempts in user input.
 * @param {string} text - User input to check
 * @param {string} type - 'resume' or 'jobDescription'
 * @returns {{ safe: boolean, threats: string[], sanitized: string }}
 */
export function detectPromptInjection(text, type = 'resume') {
  const threats = [];
  let sanitized = text;

  for (const pattern of INJECTION_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      threats.push(`Detected injection pattern: ${matches[0]}`);
      // Remove the matched pattern
      sanitized = sanitized.replace(pattern, '[FILTERED]');
    }
  }

  return {
    safe: threats.length === 0,
    threats,
    sanitized,
  };
}

/**
 * Sanitize text for AI prompt to prevent injection.
 * Only filters actual injection attempts, preserves normal text.
 */
export function sanitizeForAI(text, type = 'resume') {
  if (!text || typeof text !== 'string') return '';

  // First, detect and filter injections
  const { sanitized, threats } = detectPromptInjection(text, type);
  
  if (threats.length > 0) {
    console.warn(`[security] Prompt injection detected in ${type}:`, threats);
  }

  // Only escape quotes (minimal sanitization that won't break prompts)
  let clean = sanitized
    .replace(/"/g, '\\"')       // Escape double quotes only
    .trim();

  return clean;
}

/**
 * Validate LaTeX output for dangerous commands.
 * @param {string} latex - AI-generated LaTeX code
 * @returns {{ safe: boolean, threats: string[], sanitized: string }}
 */
export function validateLatexOutput(latex) {
  const threats = [];
  let sanitized = latex;

  for (const pattern of LATEX_DANGEROUS_PATTERNS) {
    const matches = latex.match(pattern);
    if (matches) {
      threats.push(`Dangerous LaTeX command detected: ${matches[0]}`);
      // Comment out the dangerous command
      sanitized = sanitized.replace(pattern, (match) => `% [SECURITY] ${match}`);
    }
  }

  // Remove any \write18 commands entirely (shell escape)
  sanitized = sanitized.replace(/\\write18\{[^}]*\}/gi, '% [BLOCKED] shell command');

  // Check for excessive nested braces (potential DoS)
  let depth = 0;
  let maxDepth = 0;
  for (const char of sanitized) {
    if (char === '{') depth++;
    if (char === '}') depth--;
    maxDepth = Math.max(maxDepth, depth);
  }
  if (maxDepth > 20) {
    threats.push('Excessive nested braces detected (potential DoS)');
  }

  return {
    safe: threats.length === 0,
    threats,
    sanitized,
  };
}

// ─── Filename Sanitization ──────────────────────────────────────────────

/**
 * Sanitize filename to prevent path traversal and other attacks.
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed';
  }

  return filename
    // Remove path separators
    .replace(/[\/\\]/g, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove special characters except dots and hyphens
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    // Limit length
    .slice(0, 255)
    // Remove leading dots (hidden files)
    .replace(/^\.+/, '')
    // Ensure it has an extension
    || 'unnamed';
}

/**
 * Validate file path is within allowed directory.
 * @param {string} filePath - Path to validate
 * @param {string} allowedDir - Allowed base directory
 * @returns {boolean} True if path is safe
 */
export function isPathSafe(filePath, allowedDir) {
  const { normalize, resolve } = require('node:path');
  const resolvedPath = normalize(resolve(filePath));
  const resolvedAllowed = normalize(resolve(allowedDir));
  return resolvedPath.startsWith(resolvedAllowed);
}

// ─── Cache Key Normalization ────────────────────────────────────────────

/**
 * Normalize text for cache key generation.
 * Prevents cache poisoning through trivial variations.
 */
export function normalizeForCache(text) {
  if (!text || typeof text !== 'string') return '';

  return text
    .toLowerCase()                    // Case-insensitive
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .replace(/[^\w\s]/g, '')        // Remove special chars
    .trim();
}

// ─── Input Length Validation ────────────────────────────────────────────

export const LENGTH_LIMITS = {
  resume: {
    min: 50,
    max: 15_000,
  },
  jobDescription: {
    min: 50,
    max: 10_000,
  },
  coverLetter: {
    min: 100,
    max: 5_000,
  },
  latex: {
    min: 100,
    max: 50_000,
  },
};

/**
 * Validate input length.
 */
export function validateLength(text, type, limits = LENGTH_LIMITS[type]) {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'No input provided' };
  }

  const length = text.length;
  if (length < limits.min) {
    return { valid: false, error: `Too short (${length} chars, minimum ${limits.min})` };
  }
  if (length > limits.max) {
    return { valid: false, error: `Too long (${length} chars, maximum ${limits.max})` };
  }

  return { valid: true };
}

// ─── Account Security ───────────────────────────────────────────────────

/**
 * Validate email format.
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  
  // Check for common disposable email domains
  const disposableDomains = [
    'tempmail.com', 'throwaway.email', 'guerrillamail.com',
    'mailinator.com', 'yopmail.com', 'trashmail.com',
    'fakeinbox.com', 'sharklasers.com', 'guerrillamailblock.com',
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (disposableDomains.includes(domain)) {
    return false;
  }
  
  return true;
}

/**
 * Validate password strength.
 */
export function validatePassword(password) {
  const errors = [];
  
  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain a number');
  }
  
  // Check for common weak passwords
  const weakPasswords = ['password123', 'qwerty123', 'admin123', 'letmein123'];
  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }
  
  return { valid: errors.length === 0, errors };
}

// ─── Security Headers Config ────────────────────────────────────────────

/**
 * Get security headers configuration for helmet.
 */
export function getSecurityHeaders(isProduction) {
  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // React requires unsafe-inline
        styleSrc: ["'self'", "'unsafe-inline'"],   // Tailwind requires unsafe-inline
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: ["'self'", 'https://*.supabase.co', 'https://integrate.api.nvidia.com'],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginEmbedderPolicy: false, // Required for some CDN resources
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  };
}

export default {
  detectPromptInjection,
  sanitizeForAI,
  validateLatexOutput,
  sanitizeFilename,
  isPathSafe,
  normalizeForCache,
  LENGTH_LIMITS,
  validateLength,
  isValidEmail,
  validatePassword,
  getSecurityHeaders,
};
