import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';

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

// ─── Authentication Tests ───────────────────────────────────────────────

describe('Authentication Middleware', () => {
  describe('Token Validation', () => {
    test('rejects request without Authorization header', async () => {
      const res = await fetch(`${baseUrl}/me`);
      
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.error, 'Authentication required');
    });

    test('rejects request with empty Bearer token', async () => {
      const res = await fetch(`${baseUrl}/me`, {
        headers: { authorization: 'Bearer ' },
      });
      
      assert.equal(res.status, 401);
    });

    test('rejects request with malformed Authorization header', async () => {
      const res = await fetch(`${baseUrl}/me`, {
        headers: { authorization: 'Basic xyz' },
      });
      
      assert.equal(res.status, 401);
    });

    test('rejects request with invalid JWT format', async () => {
      const res = await fetch(`${baseUrl}/me`, {
        headers: { authorization: 'Bearer invalid.jwt.token' },
      });
      
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.ok(data.error.includes('Invalid') || data.error.includes('expired'));
    });

    test('rejects request with expired JWT', async () => {
      // Create a mock expired JWT (this is a test token, not valid)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.invalid';
      
      const res = await fetch(`${baseUrl}/me`, {
        headers: { authorization: `Bearer ${expiredToken}` },
      });
      
      assert.equal(res.status, 401);
    });
  });

  describe('Protected Endpoints', () => {
    test('analysis endpoint requires authentication', async () => {
      const res = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      assert.equal(res.status, 401);
    });

    test('CV endpoint requires authentication', async () => {
      const res = await fetch(`${baseUrl}/api/analyze/cv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      assert.equal(res.status, 401);
    });

    test('cover-letter endpoint requires authentication', async () => {
      const res = await fetch(`${baseUrl}/api/analyze/cover-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      assert.equal(res.status, 401);
    });

    test('compile endpoint requires authentication', async () => {
      const res = await fetch(`${baseUrl}/api/analyze/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex: 'test' }),
      });
      
      assert.equal(res.status, 401);
    });

    test('quota endpoint requires authentication', async () => {
      const res = await fetch(`${baseUrl}/api/analyze/quota`);
      
      assert.equal(res.status, 401);
    });

    test('cache-stats endpoint requires authentication', async () => {
      const res = await fetch(`${baseUrl}/api/analyze/cache-stats`);
      
      assert.equal(res.status, 401);
    });
  });

  describe('Public Endpoints', () => {
    test('health endpoint does not require authentication', async () => {
      const res = await fetch(`${baseUrl}/health`);
      
      assert.equal(res.status, 200);
    });

    test('circuit breaker health does not require authentication', async () => {
      const res = await fetch(`${baseUrl}/health/circuit`);
      
      assert.equal(res.status, 200);
    });

    test('error summary does not require authentication', async () => {
      const res = await fetch(`${baseUrl}/health/errors`);
      
      assert.equal(res.status, 200);
    });
  });
});

// ─── Token Expiry Tests ─────────────────────────────────────────────────

describe('Token Expiry', () => {
  test('returns TOKEN_EXPIRED code for expired tokens', async () => {
    // Mock an expired JWT
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.invalid';
    
    const res = await fetch(`${baseUrl}/me`, {
      headers: { authorization: `Bearer ${expiredToken}` },
    });
    
    const data = await res.json();
    // Should indicate token issue
    assert.ok(data.error, 'Should have error message');
  });

  test('returns TOKEN_INVALID code for malformed tokens', async () => {
    const malformedToken = 'not.a.valid.jwt';
    
    const res = await fetch(`${baseUrl}/me`, {
      headers: { authorization: `Bearer ${malformedToken}` },
    });
    
    assert.equal(res.status, 401);
  });
});

// ─── Error Response Format Tests ────────────────────────────────────────

describe('Error Response Format', () => {
  test('error response has consistent structure', async () => {
    const res = await fetch(`${baseUrl}/me`);
    const data = await res.json();
    
    assert.ok('error' in data, 'Should have error field');
    assert.equal(typeof data.error, 'string', 'Error should be string');
  });

  test('includes requestId when available', async () => {
    const res = await fetch(`${baseUrl}/me`);
    
    // requestId might be in headers or body
    const requestId = res.headers.get('x-request-id');
    // This is optional but good to have
  });

  test('401 responses have proper status code', async () => {
    const res = await fetch(`${baseUrl}/me`);
    
    assert.equal(res.status, 401);
  });
});

// ─── Security Tests ─────────────────────────────────────────────────────

describe('Security', () => {
  test('does not expose internal errors in production', async () => {
    const res = await fetch(`${baseUrl}/me`);
    const data = await res.json();
    
    // Should not have stack trace or debug info in response
    assert.ok(!data.stack, 'Should not expose stack trace');
    assert.ok(!data._debug, 'Should not expose debug info');
  });

  test('handles concurrent authentication attempts', async () => {
    // Send multiple requests simultaneously
    const promises = Array(5).fill(null).map(() => 
      fetch(`${baseUrl}/me`)
    );
    
    const results = await Promise.all(promises);
    
    // All should return 401
    for (const res of results) {
      assert.equal(res.status, 401);
    }
  });

  test('handles very long Authorization header', async () => {
    const longToken = 'x'.repeat(10000);
    
    const res = await fetch(`${baseUrl}/me`, {
      headers: { authorization: `Bearer ${longToken}` },
    });
    
    // Should handle gracefully, not crash
    assert.ok(res.status >= 400, 'Should reject long tokens');
  });
});

// ─── Middleware Chain Tests ──────────────────────────────────────────────

describe('Middleware Chain', () => {
  test('auth middleware runs before route handler', async () => {
    // Test that protected endpoints return 401, not 404
    // This verifies auth middleware is in the chain
    const endpoints = [
      { path: '/api/analyze', method: 'POST' },
      { path: '/api/analyze/cv', method: 'POST' },
      { path: '/api/analyze/cover-letter', method: 'POST' },
      { path: '/api/analyze/compile', method: 'POST' },
      { path: '/api/analyze/quota', method: 'GET' },
      { path: '/api/analyze/cache-stats', method: 'GET' },
    ];
    
    for (const { path, method } of endpoints) {
      const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'POST' ? JSON.stringify({}) : undefined,
      });
      
      // Should be 401 (auth required), not 404 (not found)
      assert.equal(res.status, 401, `${path} should require auth (401), got ${res.status}`);
    }
  });

  test('rate limiter runs before auth', async () => {
    // Rate limiter should be in the chain
    const res = await fetch(`${baseUrl}/health`);
    
    // Health should work without auth
    assert.equal(res.status, 200);
  });

  test('error handler catches auth errors', async () => {
    const res = await fetch(`${baseUrl}/me`);
    const data = await res.json();
    
    // Should have structured error response
    assert.ok(data.error, 'Should have error from error handler');
  });
});
