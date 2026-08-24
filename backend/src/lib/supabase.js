import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// Admin client — uses the SECRET key, which BYPASSES RLS. Reserve it for
// privileged server ops: verifying access tokens, and account deletion.
//
// IMPORTANT: because this bypasses RLS, do NOT use it as a convenient way to
// read/write user rows — that removes the database-level isolation guarantee.
// User-scoped data access (RLS-enforced, keyed to the caller's token) gets
// added in M5 when the first feature route needs it.
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
