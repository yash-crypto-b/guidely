import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

// RLS cross-account isolation — the M3 exit criterion.
// Requires a LIVE, migrated project. Set these in backend/.env, then `npm test`:
//   SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY
//   ...and turn OFF "Confirm email" in the dashboard (signUp must return a session).
// Auto-skips when those aren't present so normal offline runs stay green.
const { SUPABASE_URL: URL, SUPABASE_PUBLISHABLE_KEY: PUB, SUPABASE_SECRET_KEY: SECRET } =
  process.env;
const skip = URL && PUB && SECRET ? false : 'set SUPABASE_URL/PUBLISHABLE/SECRET to run';

test('RLS blocks reading another user\'s resumes', { skip }, async () => {
  const admin = createClient(URL, SECRET, { auth: { persistSession: false } });
  const tag = process.hrtime.bigint().toString();
  const made = [];

  async function makeUser(who) {
    const client = createClient(URL, PUB, { auth: { persistSession: false } });
    const { data, error } = await client.auth.signUp({
      email: `guidely-rls-${who}-${tag}@example.com`,
      password: `Pw!${tag}${who}`,
    });
    assert.ok(!error, `signUp(${who}): ${error?.message}`);
    assert.ok(data.session, `no session for ${who} — is "Confirm email" turned OFF?`);
    made.push(data.user.id);
    return { client, id: data.user.id };
  }

  try {
    const a = await makeUser('a');
    const b = await makeUser('b');

    for (const u of [a, b]) {
      const { error } = await u.client.from('resumes').insert({
        user_id: u.id,
        original_filename: 'r.pdf',
        storage_path: `${u.id}/r.pdf`,
      });
      assert.ok(!error, `insert: ${error?.message}`);
    }

    const { data: aSees, error } = await a.client.from('resumes').select('user_id');
    assert.ok(!error, error?.message);
    assert.ok(aSees.length >= 1, 'A should see its own row');
    assert.ok(
      aSees.every((r) => r.user_id === a.id),
      'RLS FAILED: user A can see another account\'s rows',
    );
  } finally {
    for (const id of made) await admin.auth.admin.deleteUser(id); // cascades to rows
  }
});
