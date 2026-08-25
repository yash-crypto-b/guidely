/**
 * Input Validation Utilities
 * Validates text quality and file constraints before sending to AI.
 * Prevents wasting API calls on garbage input.
 */

import { detectPromptInjection, sanitizeFilename, LENGTH_LIMITS } from './security.js';

// ─── Text Quality Validation ────────────────────────────────────────────

// Common resume keywords to check for
const RESUME_KEYWORDS = [
  'experience', 'education', 'skills', 'work', 'project', 'university',
  'college', 'degree', 'bachelor', 'master', 'software', 'engineer',
  'developer', 'manager', 'analyst', 'intern', 'company', 'team',
  'project', 'developed', 'implemented', 'managed', 'led', 'created',
  'designed', 'built', 'improved', 'reduced', 'increased', 'achieved',
  'programming', 'javascript', 'python', 'java', 'sql', 'html', 'css',
  'react', 'node', 'aws', 'docker', 'git', 'agile', 'scrum',
];

// Garbage detection patterns
const GARBAGE_PATTERNS = [
  /[\x00-\x08\x0B\x0C\x0E-\x1F]{3,}/, // Control characters
  /(.)\1{10,}/, // Repeated characters (e.g., "aaaaaaaaaaa")
  /[^\x20-\x7E\n\r\t]{20,}/, // Long non-ASCII sequences
  /^[^\w]*$/, // Only whitespace/symbols
  /[\d\s]{20,}/, // Long sequences of digits/whitespace (OCR garbage)
];

export class TextValidationError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'TextValidationError';
    this.code = code;
    this.details = details;
    this.isValidationError = true;
  }
}

/**
 * Validate that text is meaningful resume content, not garbage.
 * @param {string} text - The text to validate
 * @param {string} type - 'resume' or 'jobDescription'
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateTextQuality(text, type = 'resume') {
  const errors = [];
  const warnings = [];
  
  if (!text || typeof text !== 'string') {
    return { valid: false, errors: ['No text provided'], warnings: [] };
  }

  const trimmed = text.trim();
  
  // Check minimum length
  const minLength = LENGTH_LIMITS[type]?.min || 50;
  if (trimmed.length < minLength) {
    errors.push(`Text is too short (${trimmed.length} chars, minimum ${minLength})`);
  }

  // Check for garbage patterns
  for (const pattern of GARBAGE_PATTERNS) {
    if (pattern.test(trimmed)) {
      errors.push('Text appears to contain garbage or corrupted data');
      break;
    }
  }

  // Check for prompt injection attempts
  const { safe, threats } = detectPromptInjection(trimmed, type);
  if (!safe) {
    warnings.push(`Potential prompt injection detected: ${threats.join(', ')}`);
    // Log the attempt but don't block - let the AI handle it with sanitization
    console.warn(`[validator] Prompt injection attempt in ${type}:`, threats);
  }

  // Check character distribution (too many special chars = likely OCR garbage)
  const specialChars = trimmed.replace(/[a-zA-Z0-9\s]/g, '').length;
  const specialRatio = specialChars / trimmed.length;
  if (specialRatio > 0.3) {
    warnings.push('Text contains many special characters (may be OCR artifact)');
  }

  // Check word count
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  if (type === 'resume') {
    if (wordCount < 20) {
      errors.push(`Too few words for a resume (${wordCount} words, minimum 20)`);
    }
    
    // Check for resume-specific keywords
    const lowerText = trimmed.toLowerCase();
    const foundKeywords = RESUME_KEYWORDS.filter(kw => lowerText.includes(kw));
    const keywordRatio = foundKeywords.length / Math.min(RESUME_KEYWORDS.length, 15);
    
    if (keywordRatio < 0.1 && wordCount > 50) {
      warnings.push('Text does not contain common resume keywords (may not be a resume)');
    }
    
    // Check for contact info patterns
    const hasEmail = /\S+@\S+\.\S+/.test(trimmed);
    const hasPhone = /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(trimmed);
    const hasLinkedIn = /linkedin\.com/i.test(trimmed);
    
    if (!hasEmail && !hasPhone && !hasLinkedIn && wordCount > 100) {
      warnings.push('No contact information found (email, phone, or LinkedIn)');
    }
  }

  if (type === 'jobDescription') {
    if (wordCount < 15) {
      errors.push(`Too few words for a job description (${wordCount} words, minimum 15)`);
    }
    
    // Check for JD-specific keywords
    const lowerText = trimmed.toLowerCase();
    const jdKeywords = ['required', 'preferred', 'qualifications', 'responsibilities', 
                        'experience', 'skills', 'degree', 'bachelor', 'must have', 
                        'nice to have', 'job title', 'position'];
    const foundKeywords = jdKeywords.filter(kw => lowerText.includes(kw));
    
    if (foundKeywords.length < 1 && wordCount > 30) {
      warnings.push('Text does not contain typical job description keywords');
    }
  }

  // Check for excessive whitespace (OCR artifact)
  const whitespaceRatio = (trimmed.match(/\s/g) || []).length / trimmed.length;
  if (whitespaceRatio > 0.4) {
    warnings.push('Text contains excessive whitespace (may be poorly formatted)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      length: trimmed.length,
      wordCount,
      lineCount: trimmed.split('\n').length,
    },
  };
}

// ─── File Validation ────────────────────────────────────────────────────

export const FILE_LIMITS = {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  maxPages: 10, // Reasonable for resume
  allowedMimeTypes: [
    'application/pdf',
    'text/plain',
  ],
  allowedExtensions: ['.pdf', '.txt'],
};

// Token budget limits (Nemotron Mini has 4096 token context)
const CONTEXT_WINDOW = 4096;
const CHARS_PER_TOKEN = 4;
const COMPLETION_BUDGET = 1500; // Reserve for AI output
const OVERHEAD = 200; // System overhead
const MAX_INPUT_CHARS = (CONTEXT_WINDOW - COMPLETION_BUDGET - OVERHEAD) * CHARS_PER_TOKEN;

/**
 * Truncate text to fit within token budget.
 * @param {string} text - Text to truncate
 * @param {string} type - 'resume' or 'jobDescription'
 * @returns {string} Truncated text
 */
export function truncateToTokenBudget(text, type = 'resume') {
  if (!text) return text;
  
  const maxChars = type === 'resume' 
    ? Math.floor(MAX_INPUT_CHARS * 0.6) // Resume gets 60% of budget
    : Math.floor(MAX_INPUT_CHARS * 0.4); // JD gets 40%
  
  if (text.length <= maxChars) return text;
  
  console.warn(`[validator] Truncating ${type} from ${text.length} to ${maxChars} chars`);
  return text.substring(0, maxChars) + '\n...[truncated to fit token limit]';
}

export class FileValidationError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'FileValidationError';
    this.code = code;
    this.details = details;
    this.isValidationError = true;
  }
}

/**
 * Sanitize uploaded filename to prevent path traversal.
 */
export function sanitizeUploadedFilename(filename) {
  return sanitizeFilename(filename);
}

/**
 * Validate uploaded file constraints.
 * @param {Object} file - Multer file object
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateFile(file) {
  const errors = [];
  
  if (!file) {
    return { valid: true, errors: [] }; // No file = using text input
  }

  // Check file size
  if (file.size > FILE_LIMITS.maxSizeBytes) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const maxMB = (FILE_LIMITS.maxSizeBytes / (1024 * 1024)).toFixed(0);
    errors.push(`File is too large (${sizeMB}MB, maximum ${maxMB}MB)`);
  }

  // Check MIME type
  if (!FILE_LIMITS.allowedMimeTypes.includes(file.mimetype)) {
    errors.push(`Unsupported file type: ${file.mimetype}. Please upload a PDF or text file.`);
  }

  // Check extension
  const ext = file.originalname?.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (ext && !FILE_LIMITS.allowedExtensions.includes(ext)) {
    errors.push(`Unsupported file extension: ${ext}. Please use .pdf or .txt files.`);
  }

  // Check for empty file
  if (file.size === 0) {
    errors.push('File is empty');
  }

  // Check filename for path traversal
  if (file.originalname && (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\'))) {
    errors.push('Invalid filename detected');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate PDF page count.
 * @param {Buffer} buffer - PDF buffer
 * @param {number} maxPages - Maximum allowed pages
 * @returns {{ valid: boolean, pageCount: number, errors: string[] }}
 */
export async function validatePdfPages(buffer, maxPages = FILE_LIMITS.maxPages) {
  const errors = [];
  let pageCount = 0;

  try {
    // Quick page count extraction without full parse
    const text = buffer.toString('latin1');
    
    // Count page objects (rough but fast)
    const pageMatches = text.match(/\/Type\s*\/Page[^s]/g);
    pageCount = pageMatches ? pageMatches.length : 0;
    
    // Alternative: count using PDF structure
    if (pageCount === 0) {
      const pageTreeMatches = text.match(/\/Count\s+(\d+)/g);
      if (pageTreeMatches) {
        const counts = pageTreeMatches.map(m => parseInt(m.match(/\d+/)[0]));
        pageCount = Math.max(...counts, 0);
      }
    }

    if (pageCount > maxPages) {
      errors.push(`PDF has too many pages (${pageCount}, maximum ${maxPages}). Please upload a shorter resume.`);
    }
  } catch (err) {
    // If we can't count pages, let the parser handle it
    console.warn('[validator] Could not count PDF pages:', err.message);
  }

  return {
    valid: errors.length === 0,
    pageCount,
    errors,
  };
}

// ─── Combined Validation ────────────────────────────────────────────────

/**
 * Comprehensive validation for analysis request.
 * @param {Object} params
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateAnalysisInput({ file, resumeText, jobDescription }) {
  const allErrors = [];
  const allWarnings = [];

  // Validate file if present
  if (file) {
    const fileResult = validateFile(file);
    allErrors.push(...fileResult.errors);
  }

  // Validate job description
  if (jobDescription) {
    const jdResult = validateTextQuality(jobDescription, 'jobDescription');
    allErrors.push(...jdResult.errors.map(e => `Job description: ${e}`));
    allWarnings.push(...jdResult.warnings.map(w => `Job description: ${w}`));
  }

  // Validate resume text (if provided directly, not from PDF)
  if (resumeText && !file) {
    const resumeResult = validateTextQuality(resumeText, 'resume');
    allErrors.push(...resumeResult.errors.map(e => `Resume: ${e}`));
    allWarnings.push(...resumeResult.warnings.map(w => `Resume: ${w}`));
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}
