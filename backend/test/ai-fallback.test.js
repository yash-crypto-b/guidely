import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeScore, aiClient } from '../src/lib/ai.js';
import { nvidiaCircuitBreaker } from '../src/lib/circuitBreaker.js';
import { validJobDescription, validResume } from './fixtures/resumes.js';

const originalCreate = aiClient.chat.completions.create;

afterEach(() => {
  aiClient.chat.completions.create = originalCreate;
  nvidiaCircuitBreaker.reset();
});

test('falls back to deterministic scoring when AI returns invalid JSON', async () => {
  aiClient.chat.completions.create = async () => ({
    choices: [{ message: { content: 'this is not valid json and should trigger the fallback path' } }],
    usage: { total_tokens: 123 },
  });

  const result = await analyzeScore({
    jobDescription: validJobDescription,
    resumeText: validResume,
  });

  assert.equal(typeof result.ats_score, 'number');
  assert.ok(result.ats_score >= 0 && result.ats_score <= 100, 'Score should be in range');
  assert.equal(result.recommendation === 'apply' || result.recommendation === 'tailor' || result.recommendation === 'skip', true);
  assert.ok(Array.isArray(result.interview_questions), 'Should return interview questions');
  assert.equal(result.interview_questions.length, 10, 'Should always return 10 interview questions');
  assert.ok(result.rationale.toLowerCase().includes('fallback'), 'Should explain the fallback path');
});

test('surfaces API key failures instead of opening the circuit breaker', async () => {
  nvidiaCircuitBreaker.reset();
  const stateBefore = nvidiaCircuitBreaker.getState();

  aiClient.chat.completions.create = async () => {
    const error = new Error('Unauthorized');
    error.status = 401;
    error.error = { message: 'Unauthorized' };
    throw error;
  };

  await assert.rejects(
    () => analyzeScore({
      jobDescription: validJobDescription,
      resumeText: validResume,
    }),
    (err) => {
      assert.equal(err.status, 401);
      assert.match(err.message, /API key|authentication/i);
      return true;
    }
  );

  assert.equal(stateBefore, 'CLOSED');
  assert.equal(nvidiaCircuitBreaker.getState(), 'CLOSED', 'Auth errors should not open the circuit breaker');
});
