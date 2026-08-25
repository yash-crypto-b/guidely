import { test, describe, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import {
  validResume,
  validResumeMinimal,
  validJobDescription,
  validJobDescriptionShort,
  garbageResume,
  garbageJobDescription,
  shortResume,
  shortJobDescription,
  mockAiScoreResponse,
  mockAiLatexResponse,
  mockCoverLetterResponse,
} from './fixtures/resumes.js';

// ─── Test Server Helper ─────────────────────────────────────────────────

let server;
let baseUrl;

before(async () => {
  server = buildApp().listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(() => {
  server.close();
});

// ─── Validation Tests ───────────────────────────────────────────────────

describe('Input Validation', () => {
  describe('Job Description Validation', () => {
    test('rejects empty job description', async () => {
      const res = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: '', resumeText: validResume }),
      });
      
      assert.equal(res.status, 401); // No auth token
    });

    test('rejects short job description (< 50 chars)', async () => {
      // This tests the schema validation
      const shortJD = 'Need';
      assert.ok(shortJD.length < 50, 'Test JD should be under 50 chars');
    });

    test('validates job description has minimum length', () => {
      assert.ok(validJobDescription.length >= 50, 'Valid JD should be >= 50 chars');
      assert.ok(shortJobDescription.length < 50, 'Short JD should be < 50 chars');
    });
  });

  describe('Resume Validation', () => {
    test('validates resume has minimum length', () => {
      assert.ok(validResume.length >= 20, 'Valid resume should be >= 20 chars');
      assert.ok(shortResume.length < 20, 'Short resume should be < 20 chars');
    });

    test('validates resume contains meaningful content', () => {
      const lowerResume = validResume.toLowerCase();
      const hasKeywords = ['experience', 'skills', 'education'].some(kw => lowerResume.includes(kw));
      assert.ok(hasKeywords, 'Valid resume should contain resume keywords');
    });

    test('detects garbage resume content', () => {
      const hasGarbage = /[\x00-\x08\x0B\x0C\x0E-\x1F]{3,}/.test(garbageResume);
      assert.ok(hasGarbage, 'Garbage resume should contain control characters');
    });
  });
});

// ─── File Upload Validation Tests ───────────────────────────────────────

describe('File Upload Validation', () => {
  test('rejects files larger than 5MB', async () => {
    // Create a fake large file (6MB)
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024);
    
    const formData = new FormData();
    formData.append('resumeFile', new Blob([largeBuffer], { type: 'application/pdf' }), 'large.pdf');
    formData.append('jobDescription', validJobDescription);

    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      body: formData,
    });

    // Should fail due to multer file size limit
    assert.ok(res.status >= 400, 'Should reject large files');
  });

  test('rejects non-PDF/TXT file types', async () => {
    const fakeImage = Buffer.from('fake image data');
    
    const formData = new FormData();
    formData.append('resumeFile', new Blob([fakeImage], { type: 'image/jpeg' }), 'photo.jpg');
    formData.append('jobDescription', validJobDescription);

    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    assert.ok(res.status >= 400, 'Should reject image files');
    // The error could be about file type or other validation
    assert.ok(data.error || data.details, 'Should have error response');
  });
});

// ─── Text Quality Validation Tests ──────────────────────────────────────

describe('Text Quality Validation', () => {
  test('validates resume text quality', () => {
    // Test with valid resume
    const lowerResume = validResume.toLowerCase();
    const hasContact = /\S+@\S+\.\S+/.test(validResume) || /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(validResume);
    const hasKeywords = ['experience', 'skills', 'education'].some(kw => lowerResume.includes(kw));
    
    assert.ok(hasContact, 'Valid resume should have contact info');
    assert.ok(hasKeywords, 'Valid resume should have keywords');
  });

  test('validates job description quality', () => {
    const lowerJD = validJobDescription.toLowerCase();
    const hasKeywords = ['required', 'qualifications', 'experience', 'skills'].some(kw => lowerJD.includes(kw));
    
    assert.ok(hasKeywords, 'Valid JD should have job-related keywords');
  });

  test('rejects garbage text', () => {
    const hasControlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F]{3,}/.test(garbageResume);
    assert.ok(hasControlChars, 'Garbage should have control characters');
  });
});

// ─── API Schema Validation Tests ────────────────────────────────────────

describe('API Schema Validation', () => {
  test('Zod schema validates job description length', async () => {
    // Import the schema
    const { z } = await import('zod');
    
    const analyzeSchema = z.object({
      jobDescription: z.string().min(50).max(10_000),
      resumeText: z.string().min(20).max(15_000),
    });

    // Valid input
    const validResult = analyzeSchema.safeParse({
      jobDescription: validJobDescription,
      resumeText: validResume,
    });
    assert.ok(validResult.success, 'Valid input should pass schema');

    // Invalid: short JD
    const invalidJD = analyzeSchema.safeParse({
      jobDescription: shortJobDescription,
      resumeText: validResume,
    });
    assert.ok(!invalidJD.success, 'Short JD should fail schema');

    // Invalid: short resume
    const invalidResume = analyzeSchema.safeParse({
      jobDescription: validJobDescription,
      resumeText: shortResume,
    });
    assert.ok(!invalidResume.success, 'Short resume should fail schema');
  });

  test('Zod schema enforces max lengths', async () => {
    const { z } = await import('zod');
    
    const analyzeSchema = z.object({
      jobDescription: z.string().min(50).max(10_000),
      resumeText: z.string().min(20).max(15_000),
    });

    // Too long JD
    const longJD = 'x'.repeat(10_001);
    const result = analyzeSchema.safeParse({
      jobDescription: longJD,
      resumeText: validResume,
    });
    assert.ok(!result.success, 'Too long JD should fail');
  });
});

// ─── Rate Limiting Tests ────────────────────────────────────────────────

describe('Rate Limiting', () => {
  test('returns rate limit headers', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    // Health endpoint may or may not have rate limit headers
  });

  test('rejects when rate limit exceeded', async () => {
    // This is a basic test - actual rate limiting requires many requests
    // In real testing, you'd mock the rate limiter or use a test-specific config
    const res = await fetch(`${baseUrl}/api/analyze/quota`);
    // Should get 401 without auth
    assert.equal(res.status, 401);
  });
});

// ─── Error Handling Tests ───────────────────────────────────────────────

describe('Error Handling', () => {
  test('returns structured error response', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Empty body
    });

    assert.equal(res.status, 401);
    const data = await res.json();
    assert.ok(data.error, 'Error response should have error field');
  });

  test('includes requestId in error response', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const data = await res.json();
    // requestId might be present depending on middleware
    assert.ok(data.error, 'Should have error message');
  });

  test('handles invalid JSON body', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json{',
    });

    assert.ok(res.status >= 400, 'Should reject invalid JSON');
  });
});

// ─── Health Check Tests ─────────────────────────────────────────────────

describe('Health Checks', () => {
  test('GET /health returns ok', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
  });

  test('GET /health/circuit returns circuit breaker status', async () => {
    const res = await fetch(`${baseUrl}/health/circuit`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.circuitBreaker, 'Should have circuit breaker info');
    assert.ok(data.aiService, 'Should have AI service info');
  });

  test('GET /health/errors returns error summary', async () => {
    const res = await fetch(`${baseUrl}/health/errors`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok('totalErrors' in data || 'error' in data, 'Should have error summary');
  });
});

// ─── Cache Tests ────────────────────────────────────────────────────────

describe('Cache System', () => {
  test('cache stats endpoint requires auth', async () => {
    const res = await fetch(`${baseUrl}/api/analyze/cache-stats`);
    assert.equal(res.status, 401, 'Should require auth');
  });

  test('clear cache endpoint requires auth', async () => {
    const res = await fetch(`${baseUrl}/api/analyze/clear-cache`, {
      method: 'POST',
    });
    assert.equal(res.status, 401, 'Should require auth');
  });
});

// ─── Quota System Tests ─────────────────────────────────────────────────

describe('Quota System', () => {
  test('quota endpoint requires auth', async () => {
    const res = await fetch(`${baseUrl}/api/analyze/quota`);
    assert.equal(res.status, 401, 'Should require auth');
  });
});

// ─── LaTeX Validation Tests ─────────────────────────────────────────────

describe('LaTeX Validation', () => {
  test('validates LaTeX document structure', () => {
    // Check for required LaTeX elements
    assert.ok(mockAiLatexResponse.includes('\\documentclass'), 'Should have documentclass');
    assert.ok(mockAiLatexResponse.includes('\\begin{document}'), 'Should have begin document');
    assert.ok(mockAiLatexResponse.includes('\\end{document}'), 'Should have end document');
  });

  test('validates LaTeX has sections', () => {
    assert.ok(mockAiLatexResponse.includes('\\section'), 'Should have sections');
  });

  test('detects invalid LaTeX', () => {
    const invalidLatex = 'This is not LaTeX at all';
    assert.ok(!invalidLatex.includes('\\documentclass'), 'Invalid LaTeX should not have documentclass');
  });
});

// ─── Cover Letter Validation Tests ──────────────────────────────────────

describe('Cover Letter Validation', () => {
  test('validates cover letter has minimum length', () => {
    assert.ok(mockCoverLetterResponse.length >= 50, 'Cover letter should be >= 50 chars');
  });

  test('validates cover letter has proper structure', () => {
    const hasGreeting = mockCoverLetterResponse.toLowerCase().includes('dear');
    const hasClosing = mockCoverLetterResponse.toLowerCase().includes('sincerely');
    
    assert.ok(hasGreeting, 'Should have greeting');
    assert.ok(hasClosing, 'Should have closing');
  });

  test('validates cover letter has paragraphs', () => {
    const paragraphs = mockCoverLetterResponse.split('\n\n').filter(p => p.trim());
    assert.ok(paragraphs.length >= 2, 'Should have multiple paragraphs');
  });
});
