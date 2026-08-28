import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import { execFile } from 'node:child_process';
import { writeFile, unlink, readFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { requireAuth } from '../middleware/auth.js';
import { requireQuota, getUserQuotaStatus } from '../middleware/quota.js';
import { requireUserRateLimit } from '../middleware/userRateLimit.js';
import { analyzeScore, generateCustomCV, generateCoverLetter } from '../lib/ai.js';
import { getCachedResult, setCachedResult, getCacheStats, clearCache } from '../lib/cache.js';
import { validateTextQuality, validateFile, validatePdfPages, validateAnalysisInput, truncateToTokenBudget, TextValidationError, FileValidationError } from '../lib/validators.js';
import { recordAnalysis } from './stats.js';
import {
  logAnalysisComplete,
  logAnalysisFailed,
  logCVGenerated,
  logCVFailed,
  logPDFParsed,
  logPDFFailed,
  logCacheHit,
  logCacheMiss,
} from '../lib/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TECTONIC_PATH = join(__dirname, '../../tectonic.exe');

// Helper to compile LaTeX to PDF using tectonic
async function compileLatex(latexCode) {
  const id = randomBytes(8).toString('hex');
  const workDir = join(tmpdir(), `latex-${id}`);
  await mkdir(workDir, { recursive: true });

  const texFile = join(workDir, 'resume.tex');
  const pdfFile = join(workDir, 'resume.pdf');

  await writeFile(texFile, latexCode, 'utf-8');

  // Try local tectonic first, then system pdflatex
  const compilers = [
    { cmd: TECTONIC_PATH, args: [texFile], cwd: workDir },
    { cmd: 'tectonic', args: [texFile], cwd: workDir },
    { cmd: 'pdflatex', args: ['-interaction=nonstopmode', '-halt-on-error', '-output-directory', workDir, texFile], cwd: workDir },
  ];

  for (const compiler of compilers) {
    try {
      console.log(`[compile] Trying ${compiler.cmd}...`);
      await new Promise((resolve, reject) => {
        execFile(compiler.cmd, compiler.args, { timeout: 60_000, cwd: compiler.cwd }, (err, stdout, stderr) => {
          if (err) {
            console.log(`[compile] ${compiler.cmd} failed:`, err.message);
            reject(err);
          } else {
            console.log(`[compile] ${compiler.cmd} succeeded`);
            resolve();
          }
        });
      });

      // Check if PDF was created
      try {
        const pdfBuffer = await readFile(pdfFile);
        // Cleanup tex file
        await unlink(texFile).catch(() => {});
        return pdfBuffer;
      } catch {
        // PDF not created, try next compiler
        console.log(`[compile] PDF not found after ${compiler.cmd}`);
      }
    } catch {
      // Compiler not found or failed, try next
    }
  }

  // Cleanup on failure
  await unlink(texFile).catch(() => {});
  throw new Error('PDF compilation failed. Please download the .tex file and compile it locally or use Overleaf.');
}

export const analysisRouter = Router();

// Multer with file size limit
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1, // Only 1 file per request
  } 
});

const analyzeSchema = z.object({
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters').max(10_000),
  resumeText: z.string().min(20, 'Resume text must be at least 20 characters').max(15_000),
});

// ─── PDF Parsing Helpers ────────────────────────────────────────────────

// Strategy 1: pdf-parse (primary)
function tryPdfParse(buffer) {
  return new Promise((resolve, reject) => {
    const parser = new PDFParse({ data: buffer });
    parser.getText()
      .then(result => {
        if (!result || !result.text) {
          reject(new Error('No text extracted'));
          return;
        }
        const text = result.text
          .replace(/\s+/g, ' ')
          .replace(/[^\x20-\x7E\n]/g, '')
          .trim();
        resolve({ text, numPages: result.numpages || 0 });
      })
      .catch(reject);
  });
}

// Strategy 2: pdf2json (fallback)
async function tryPdf2Json(buffer) {
  const PDFParser = (await import('pdf2json')).default;
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();
    parser.on('pdfParser_dataError', err => reject(new Error(err.parserError || 'pdf2json parse error')));
    parser.on('pdfParser_dataReady', data => {
      try {
        let text = '';
        let pageCount = 0;
        if (data?.Pages) {
          pageCount = data.Pages.length;
          for (const page of data.Pages) {
            if (page.Texts) {
              for (const t of page.Texts) {
                if (t.R) {
                  for (const r of t.R) {
                    if (r.T) {
                      text += decodeURIComponent(r.T) + ' ';
                    }
                  }
                }
              }
              text += '\n';
            }
          }
        }
        resolve({ 
          text: text.replace(/\s+/g, ' ').replace(/[^\x20-\x7E\n]/g, '').trim(),
          numPages: pageCount,
        });
      } catch (e) {
        reject(e);
      }
    });
    parser.parseBuffer(buffer);
  });
}

// Combined PDF extraction with fallbacks and validation
async function extractPdfText(buffer, userId, filename) {
  let numPages = 0;
  let method = '';

  // Strategy 1: pdf-parse
  try {
    const result = await tryPdfParse(buffer);
    numPages = result.numPages;
    method = 'pdf-parse';
    
    if (result.text.length >= 10) {
      console.log(`[analysis] pdf-parse extracted ${result.text.length} chars, ${numPages} pages`);
      await logPDFParsed({ userId, method, charsExtracted: result.text.length, fileSize: buffer.length, numPages });
      return { text: result.text, numPages, method };
    }
    console.log('[analysis] pdf-parse returned too little text, trying fallback...');
  } catch (e) {
    console.log('[analysis] pdf-parse failed:', e.message, '- trying fallback...');
  }

  // Strategy 2: pdf2json
  try {
    const result = await tryPdf2Json(buffer);
    numPages = result.numPages;
    method = 'pdf2json';
    
    if (result.text.length >= 10) {
      console.log(`[analysis] pdf2json extracted ${result.text.length} chars, ${numPages} pages`);
      await logPDFParsed({ userId, method, charsExtracted: result.text.length, fileSize: buffer.length, numPages });
      return { text: result.text, numPages, method };
    }
  } catch (e) {
    console.log('[analysis] pdf2json also failed:', e.message);
  }

  // Both failed
  await logPDFFailed({ userId, error: new Error('No text extracted from PDF'), fileSize: buffer.length });
  return null;
}

// Extract resume text from request with validation
async function extractResumeText(req) {
  if (!req.file) return { text: req.body.resumeText || '', fromFile: false };

  // Plain text files
  if (req.file.mimetype === 'text/plain' || req.file.originalname.endsWith('.txt')) {
    const text = req.file.buffer.toString('utf-8');
    return { text, fromFile: true, method: 'text-plain' };
  }

  // PDF files
  if (req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf')) {
    const result = await extractPdfText(req.file.buffer, req.user?.id, req.file.originalname);
    if (result) {
      return { 
        text: result.text, 
        fromFile: true, 
        method: result.method,
        numPages: result.numPages,
      };
    }

    throw new TextValidationError(
      'We couldn\'t extract text from this PDF. It may be a scanned image, encrypted, or corrupted. ' +
      'Please try one of these options:\n' +
      '• Paste your resume text directly in the text area below\n' +
      '• Upload a different PDF that contains selectable text\n' +
      '• Save your resume as a .txt file and upload that instead',
      'PDF_PARSE_FAILED'
    );
  }

  throw new FileValidationError(
    'Unsupported file type. Please upload a .pdf or .txt file.',
    'UNSUPPORTED_FILE_TYPE'
  );
}

// ─── POST /api/analyze — Fast: score + breakdown + questions ────────────
analysisRouter.post('/', 
  requireAuth, 
  requireUserRateLimit('analysis'),
  requireQuota('analysis'), 
  upload.single('resumeFile'), 
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      console.log('[analysis] Request received');
      console.log('[analysis] File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'none');

      // Extract resume text
      const { text: resumeText, fromFile, method, numPages } = await extractResumeText(req);
      const jobDescription = req.body.jobDescription || '';
      
      console.log(`[analysis] JD: ${jobDescription.length} chars, Resume: ${resumeText.length} chars`);
      if (fromFile) {
        console.log(`[analysis] Source: ${method}, Pages: ${numPages || 'unknown'}`);
      }

      // Validate file constraints
      if (req.file) {
        const fileValidation = validateFile(req.file);
        if (!fileValidation.valid) {
          return res.status(400).json({ 
            error: 'File validation failed',
            details: fileValidation.errors,
          });
        }

        // Check page count for PDFs
        if (req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf')) {
          const pageValidation = await validatePdfPages(req.file.buffer);
          if (!pageValidation.valid) {
            return res.status(400).json({
              error: 'PDF validation failed',
              details: pageValidation.errors,
              pageCount: pageValidation.pageCount,
            });
          }
        }
      }

      // Validate text quality
      const resumeValidation = validateTextQuality(resumeText, 'resume');
      if (!resumeValidation.valid) {
        return res.status(400).json({
          error: 'Resume text quality check failed',
          details: resumeValidation.errors,
          suggestions: [
            'Ensure your resume contains readable text (not just images)',
            'Check that the PDF is not corrupted or encrypted',
            'Try pasting your resume text directly instead of uploading',
          ],
        });
      }

      // Warn about quality issues but don't block
      if (resumeValidation.warnings.length > 0) {
        console.log('[analysis] Resume warnings:', resumeValidation.warnings);
      }

      // Validate job description quality
      const jdValidation = validateTextQuality(jobDescription, 'jobDescription');
      if (!jdValidation.valid) {
        return res.status(400).json({
          error: 'Job description quality check failed',
          details: jdValidation.errors,
          suggestions: [
            'Ensure the job description is at least 50 characters',
            'Include key details like required skills and qualifications',
            'Paste the full job posting, not just the title',
          ],
        });
      }

      // Validate combined input
      const inputValidation = validateAnalysisInput({
        file: req.file,
        resumeText,
        jobDescription,
      });

      if (!inputValidation.valid) {
        return res.status(400).json({
          error: 'Input validation failed',
          details: inputValidation.errors,
        });
      }

      // Log warnings
      if (inputValidation.warnings.length > 0) {
        console.log('[analysis] Input warnings:', inputValidation.warnings);
      }

      // Schema validation (length constraints)
      const parsed = analyzeSchema.safeParse({ jobDescription, resumeText });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join('; ') });
      }

      const { jobDescription: jd, resumeText: resume } = parsed.data;

      // Truncate inputs to fit within 4096 token context window
      const truncatedJD = truncateToTokenBudget(jd, 'jobDescription');
      const truncatedResume = truncateToTokenBudget(resume, 'resume');
      console.log(`[analysis] After truncation - JD: ${truncatedJD.length} chars, Resume: ${truncatedResume.length} chars`);

      // Check cache
      const cached = await getCachedResult(truncatedJD, truncatedResume);
      if (cached) {
        console.log('[analysis] Cache hit');
        await logCacheHit({ userId: req.user?.id, key: 'analysis' });
        return res.json({ ...cached, cached: true, parsedResumeText: truncatedResume });
      }

      await logCacheMiss({ userId: req.user?.id, key: 'analysis' });

      // Call AI
      console.log('[analysis] Calling AI...');
      console.log('[analysis] JD length:', truncatedJD.length, 'Resume length:', truncatedResume.length);
      let result;
      try {
        result = await analyzeScore({ jobDescription: truncatedJD, resumeText: truncatedResume });
      } catch (aiErr) {
        console.error('[analysis] AI error:', aiErr.message);
        console.error('[analysis] AI error stack:', aiErr.stack);
        throw aiErr;
      }
      const durationMs = Date.now() - startTime;
      console.log('[analysis] AI responded, score:', result.ats_score, 'in', durationMs, 'ms');

      await setCachedResult(truncatedJD, truncatedResume, result);

      await logAnalysisComplete({
        userId: req.user?.id,
        jobDescriptionLength: truncatedJD.length,
        resumeLength: truncatedResume.length,
        result,
        durationMs,
        cached: false,
      });

      // Record in user history
      recordAnalysis(req.user?.id, {
        score: result.ats_score,
        recommendation: result.recommendation,
        job_title: jd.substring(0, 80),
        created_at: new Date().toISOString(),
      });

      res.json({ ...result, cached: false, parsedResumeText: truncatedResume });
    } catch (err) {
      const durationMs = Date.now() - startTime;
      console.error('[analysis] Error:', err.message);
      await logAnalysisFailed({ userId: req.user?.id, error: err, durationMs });
      next(err);
    }
  }
);

// ─── POST /api/analyze/cv — Slower: generate custom LaTeX CV ───────────
analysisRouter.post('/cv', 
  requireAuth, 
  requireUserRateLimit('cv'),
  requireQuota('cv'), 
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { jobDescription, resumeText, rationale } = req.body;
      if (!jobDescription || !resumeText) {
        return res.status(400).json({ error: 'jobDescription and resumeText are required' });
      }

      // Basic length validation (main analysis already validated)
      if (jobDescription.length < 20) {
        return res.status(400).json({ error: 'Job description too short' });
      }
      if (resumeText.length < 10) {
        return res.status(400).json({ error: 'Resume text too short' });
      }

      // Truncate inputs to fit within token budget
      const truncatedJD = truncateToTokenBudget(jobDescription, 'jobDescription');
      const truncatedResume = truncateToTokenBudget(resumeText, 'resume');

      console.log('[analysis] Generating CV...');
      const latex = await generateCustomCV({ jobDescription: truncatedJD, resumeText: truncatedResume, rationale });
      const durationMs = Date.now() - startTime;
      console.log('[analysis] CV generated, length:', latex.length, 'in', durationMs, 'ms');

      await logCVGenerated({ userId: req.user?.id, latexLength: latex.length, durationMs });

      res.json({ custom_cv: latex });
    } catch (err) {
      const durationMs = Date.now() - startTime;
      console.error('[analysis] CV generation error:', err.message);
      await logCVFailed({ userId: req.user?.id, error: err, durationMs });
      next(err);
    }
  }
);

// ─── POST /api/analyze/cover-letter — Generate cover letter ────────────
analysisRouter.post('/cover-letter', 
  requireAuth, 
  requireUserRateLimit('coverLetter'),
  requireQuota('cv'), 
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { jobDescription, resumeText, rationale, company } = req.body;
      if (!jobDescription || !resumeText) {
        return res.status(400).json({ error: 'jobDescription and resumeText are required' });
      }

      // Basic length validation (main analysis already validated)
      if (jobDescription.length < 20) {
        return res.status(400).json({ error: 'Job description too short' });
      }
      if (resumeText.length < 10) {
        return res.status(400).json({ error: 'Resume text too short' });
      }

      // Truncate inputs to fit within token budget
      const truncatedJD = truncateToTokenBudget(jobDescription, 'jobDescription');
      const truncatedResume = truncateToTokenBudget(resumeText, 'resume');

      console.log('[analysis] Generating cover letter...');
      const coverLetter = await generateCoverLetter({ jobDescription: truncatedJD, resumeText: truncatedResume, rationale, company });
      const durationMs = Date.now() - startTime;
      console.log('[analysis] Cover letter generated, length:', coverLetter.length, 'in', durationMs, 'ms');

      res.json({ cover_letter: coverLetter });
    } catch (err) {
      const durationMs = Date.now() - startTime;
      console.error('[analysis] Cover letter generation error:', err.message);
      next(err);
    }
  }
);

// ─── POST /api/analyze/compile — Compile LaTeX to PDF ──────────────────
analysisRouter.post('/compile', 
  requireAuth, 
  requireUserRateLimit('compile'),
  requireQuota('compile'), 
  async (req, res, next) => {
    try {
      const { latex } = req.body;
      if (!latex || typeof latex !== 'string') {
        return res.status(400).json({ error: 'LaTeX code is required' });
      }

      // Validate LaTeX is not empty/garbage
      if (latex.trim().length < 100) {
        return res.status(400).json({ error: 'LaTeX code is too short' });
      }

      console.log('[compile] Compiling LaTeX to PDF...');
      const pdfBuffer = await compileLatex(latex);
      console.log('[compile] PDF generated,', pdfBuffer.length, 'bytes');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="resume-optimized.pdf"');
      res.send(pdfBuffer);
    } catch (err) {
      console.error('[compile] Error:', err.message);
      next(err);
    }
  }
);

// ─── GET /api/analyze/quota — Get user quota status ────────────────────
analysisRouter.get('/quota', 
  requireAuth, 
  requireUserRateLimit('default'),
  async (req, res) => {
    try {
      const status = await getUserQuotaStatus(req.user.id);
      res.json(status);
    } catch (err) {
      console.error('[quota] Error:', err.message);
      res.status(500).json({ error: 'Failed to get quota status' });
    }
  }
);

// ─── Debug endpoints ───────────────────────────────────────────────────
analysisRouter.get('/cache-stats', 
  requireAuth, 
  requireUserRateLimit('default'),
  async (req, res) => {
    res.json(await getCacheStats());
  }
);

analysisRouter.post('/clear-cache', 
  requireAuth, 
  requireUserRateLimit('default'),
  async (req, res) => {
    res.json({ message: await clearCache() });
  }
);
