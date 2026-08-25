import { createClient } from '@supabase/supabase-js';

// Public publishable key — safe in the browser ONLY because RLS is enforced
// on every table (see supabase/migrations/0001_init.sql).
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY — copy frontend/.env.example to frontend/.env and fill them in.',
  );
}

// Defaults persist the session in localStorage, auto-refresh tokens, and
// detect the OAuth callback in the URL — exactly what the auth screen needs.
export const supabase = createClient(url, key);
