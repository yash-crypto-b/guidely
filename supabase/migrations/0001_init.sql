-- Guidely — initial schema, RLS, and storage policies (Phase 1)
-- Apply by pasting into Supabase Studio → SQL Editor → Run
-- (or `supabase db push` if you use the CLI). Safe to re-run — idempotent.

create extension if not exists pgcrypto;  -- gen_random_uuid()

-- ── recommendation enum ───────────────────────────────────────────────
do $$ begin
  create type recommendation as enum ('apply', 'tailor', 'skip');
exception when duplicate_object then null;
end $$;

-- ── tables ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  plan         text not null default 'free',   -- reserved for Phase 2
  created_at   timestamptz not null default now()
);

create table if not exists public.resumes (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  original_filename text not null,
  storage_path      text not null,
  extracted_text    text,
  created_at        timestamptz not null default now()
);
create index if not exists resumes_user_id_idx on public.resumes(user_id);

create table if not exists public.analyses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  resume_id       uuid not null references public.resumes(id) on delete cascade,
  job_description text not null,
  ats_score       int check (ats_score between 0 and 100),
  score_breakdown jsonb,
  recommendation  recommendation,
  rationale       text,
  created_at      timestamptz not null default now()
);
create index if not exists analyses_user_id_idx on public.analyses(user_id);

create table if not exists public.generated_cvs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  analysis_id      uuid not null references public.analyses(id) on delete cascade,
  tailored_content jsonb,
  pdf_storage_path text,
  created_at       timestamptz not null default now()
);
create index if not exists generated_cvs_user_id_idx on public.generated_cvs(user_id);

create table if not exists public.interview_preps (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  questions   jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists interview_preps_user_id_idx on public.interview_preps(user_id);

-- ── auto-create a profile row on signup ───────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',
                           new.raw_user_meta_data->>'name'))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── RLS: every table, owner-only ──────────────────────────────────────
alter table public.profiles        enable row level security;
alter table public.resumes         enable row level security;
alter table public.analyses        enable row level security;
alter table public.generated_cvs   enable row level security;
alter table public.interview_preps enable row level security;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
-- inserts happen via the security-definer trigger; no client insert policy needed

do $$
declare t text;
begin
  foreach t in array array['resumes','analyses','generated_cvs','interview_preps'] loop
    execute format('drop policy if exists %I on public.%I', t || '_all_own', t);
    execute format(
      'create policy %I on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t || '_all_own', t);
  end loop;
end $$;

-- ── storage: private bucket, per-user folder (<uid>/<file>) ────────────
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

do $$
declare act text;
begin
  foreach act in array array['select','insert','update','delete'] loop
    execute format('drop policy if exists %I on storage.objects', 'resumes_bucket_' || act || '_own');
  end loop;
end $$;

create policy resumes_bucket_select_own on storage.objects
  for select using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy resumes_bucket_insert_own on storage.objects
  for insert with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy resumes_bucket_update_own on storage.objects
  for update using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy resumes_bucket_delete_own on storage.objects
  for delete using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
