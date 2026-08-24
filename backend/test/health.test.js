import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';

// Boots the real app on an ephemeral port and hits it over HTTP — proves the
// middleware chain wires up and /health responds. No test framework/deps.
async function withServer(fn) {
  const server = buildApp().listen(0);
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
  }
}

test('GET /health returns ok', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).status, 'ok');
  });
});

test('unknown route returns 404 JSON', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/does-not-exist`);
    assert.equal(res.status, 404);
    assert.equal((await res.json()).error, 'Not found');
  });
});
