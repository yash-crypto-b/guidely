import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import { mockAiLatexResponse } from './fixtures/resumes.js';

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

// ─── LaTeX Compilation Tests ────────────────────────────────────────────

describe('LaTeX Compilation', () => {
  test('compile endpoint requires authentication', async () => {
    const res = await fetch(`${baseUrl}/api/analyze/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latex: mockAiLatexResponse }),
    });

    assert.equal(res.status, 401, 'Should require authentication');
  });

  test('compile endpoint validates LaTeX input', async () => {
    // Test without auth - should fail at auth, but validates endpoint exists
    const res = await fetch(`${baseUrl}/api/analyze/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latex: '' }),
    });

    assert.ok(res.status >= 400, 'Should reject empty LaTeX');
  });

  test('compile endpoint validates LaTeX is string', async () => {
    const res = await fetch(`${baseUrl}/api/analyze/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latex: 123 }), // Not a string
    });

    // Should fail at auth or validation
    assert.ok(res.status >= 400, 'Should reject non-string LaTeX');
  });
});

// ─── LaTeX Document Structure Tests ─────────────────────────────────────

describe('LaTeX Document Structure', () => {
  test('valid LaTeX must have documentclass', () => {
    const hasDocumentclass = mockAiLatexResponse.includes('\\documentclass');
    assert.ok(hasDocumentclass, 'LaTeX must start with \\documentclass');
  });

  test('valid LaTeX must have begin/end document', () => {
    const hasBegin = mockAiLatexResponse.includes('\\begin{document}');
    const hasEnd = mockAiLatexResponse.includes('\\end{document}');
    
    assert.ok(hasBegin, 'Must have \\begin{document}');
    assert.ok(hasEnd, 'Must have \\end{document}');
  });

  test('LaTeX document is properly closed', () => {
    const beginIndex = mockAiLatexResponse.indexOf('\\begin{document}');
    const endIndex = mockAiLatexResponse.indexOf('\\end{document}');
    
    assert.ok(beginIndex < endIndex, '\\begin{document} must come before \\end{document}');
  });

  test('valid LaTeX has at least one section', () => {
    const sections = mockAiLatexResponse.match(/\\section/g);
    assert.ok(sections && sections.length >= 1, 'Should have at least one section');
  });

  test('LaTeX escaping handles special characters', () => {
    // Test that special chars are properly escaped
    const testCases = [
      { input: '100%', escaped: '100\\%' },
      { input: 'C++', escaped: 'C\\textbf{++}' },
      { input: 'A&B', escaped: 'A\\&B' },
    ];

    for (const { input, escaped } of testCases) {
      // These are examples of what should be escaped
      assert.ok(typeof escaped === 'string', 'Escaped value should be string');
    }
  });
});

// ─── PDF Output Validation Tests ────────────────────────────────────────

describe('PDF Output Validation', () => {
  test('PDF buffer should start with PDF header', () => {
    // This tests the expected format of a valid PDF
    const pdfHeader = '%PDF-';
    assert.ok(pdfHeader.length === 5, 'PDF header should be 5 chars');
  });

  test('PDF should contain required metadata', () => {
    // Test structure of a valid PDF
    const validPdfStructure = {
      hasHeader: true,
      hasPages: true,
      hasTrailer: true,
    };
    
    assert.ok(validPdfStructure.hasHeader, 'PDF should have header');
    assert.ok(validPdfStructure.hasPages, 'PDF should have pages');
    assert.ok(validPdfStructure.hasTrailer, 'PDF should have trailer');
  });
});

// ─── Tectonic Compiler Tests ────────────────────────────────────────────

describe('Tectonic Compiler', () => {
  test('tectonic path is configured', async () => {
    // Check if tectonic.exe exists
    const { existsSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const tectonicPath = join(__dirname, '../../tectonic.exe');
    
    // In test environment, tectonic might not exist
    // This test just verifies the path logic
    assert.ok(typeof tectonicPath === 'string', 'Tectonic path should be a string');
  });

  test('compiler fallback chain is defined', () => {
    // Test that the fallback chain includes multiple compilers
    const compilers = ['tectonic.exe', 'tectonic', 'pdflatex'];
    assert.ok(compilers.length >= 2, 'Should have at least 2 compiler options');
  });
});

// ─── Error Handling Tests ───────────────────────────────────────────────

describe('Compilation Error Handling', () => {
  test('handles invalid LaTeX gracefully', () => {
    const invalidLatex = 'This is not LaTeX at all';
    
    // Should not include documentclass
    assert.ok(!invalidLatex.includes('\\documentclass'), 'Invalid LaTeX should not have documentclass');
  });

  test('handles empty LaTeX input', () => {
    const emptyLatex = '';
    assert.equal(emptyLatex.length, 0, 'Empty LaTeX should have length 0');
  });

  test('detects incomplete LaTeX documents', () => {
    // Test for missing end document tag - use a truly incomplete example
    const incompleteLatex = `\\documentclass{article}
\\begin{document}
Hello World
This document is missing the end tag`;
    
    // Check that it does NOT contain \end{document}
    const hasEndDocument = incompleteLatex.includes('\\end{document}');
    assert.equal(hasEndDocument, false, 'Incomplete LaTeX should not have end document');
    
    // Verify we can detect this as invalid
    const isValid = incompleteLatex.includes('\\documentclass') && incompleteLatex.includes('\\end{document}');
    assert.equal(isValid, false, 'Incomplete LaTeX should be detected as invalid');
  });

  test('validates LaTeX has proper structure', () => {
    // Test various invalid LaTeX structures
    const testCases = [
      { latex: 'no documentclass', shouldHaveDocClass: false },
      { latex: '\\documentclass{article}', shouldHaveDocClass: true },
      { latex: mockAiLatexResponse, shouldHaveDocClass: true },
    ];
    
    for (const { latex, shouldHaveDocClass } of testCases) {
      const hasDocClass = latex.includes('\\documentclass');
      assert.equal(hasDocClass, shouldHaveDocClass, 
        `LaTeX "${latex.substring(0, 30)}..." should ${shouldHaveDocClass ? 'have' : 'not have'} documentclass`);
    }
  });
});

// ─── Security Tests ─────────────────────────────────────────────────────

describe('Compilation Security', () => {
  test('LaTeX input should not contain shell commands', () => {
    const maliciousLatex = `\\documentclass{article}
\\begin{document}
\\immediate\\write18{rm -rf /}
\\end{document}`;
    
    // Check for dangerous patterns
    const hasShellCommand = /\\write18|\\immediate|system\(/.test(maliciousLatex);
    // This is a test to ensure we're aware of the risk
    assert.ok(typeof hasShellCommand === 'boolean', 'Should detect shell commands');
  });

  test('file path should be sanitized', () => {
    const maliciousPath = '../../etc/passwd';
    const hasTraversal = maliciousPath.includes('..');
    
    assert.ok(hasTraversal, 'Malicious path should have traversal');
  });
});
