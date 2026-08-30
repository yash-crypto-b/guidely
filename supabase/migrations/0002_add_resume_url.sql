-- Guidely — add resume_url to users table
-- Apply via Supabase Studio → SQL Editor → Run

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS resume_url text;
