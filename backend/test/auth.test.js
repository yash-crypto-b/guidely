import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';

// Offline test: the auth gate must reject with 401 before any Supabase call,
// so this runs without network or a live project.
test('GET /me without a token returns 401', async () => {
  const server = buildApp().listen(0);
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/me`);
    assert.equal(res.status, 401);
    assert.equal((await res.json()).error, 'Authentication required');
  } finally {
    server.close();
  }
});

test('GET /me with a malformed header returns 401', async () => {
  const server = buildApp().listen(0);
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/me`, {
      headers: { authorization: 'Basic xyz' },
    });
    assert.equal(res.status, 401);
  } finally {
    server.close();
  }
});
