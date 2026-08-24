# Guidely

Job-fit analysis, ATS scoring, tailored CV generation, and interview prep. (Phase 1)

A user pastes a job description and uploads their resume; Guidely returns an ATS match
score with breakdown, an honest apply/skip recommendation, a tailored ATS-friendly CV
(previewable + PDF download), and predicted interview questions with guidance. Everything
is saved to the user's account.

## Stack

- **Frontend:** React (JS/JSX) + Vite, Tailwind, shadcn/ui, React Router, Supabase JS, PostHog
- **Backend:** Node.js + Express (JS), API only — all AI and secret-bearing calls proxied here
- **Data/Auth:** Supabase (Postgres + Auth + private Storage), RLS on every table
- **AI:** NVIDIA Nemotron via OpenAI-compatible endpoint (`integrate.api.nvidia.com/v1`)
- **Analytics:** PostHog (public key, no PII)

Plain JavaScript throughout — no TypeScript. Runtime validation with `zod` everywhere.

## Repo layout

```
guidely3/
├─ backend/     Node.js + Express API
├─ frontend/    Vite + React
└─ supabase/    SQL migrations (schema + RLS + storage policies)
```

## Prerequisites

<!-- Node version, npm, a Supabase project, an NVIDIA API key -->

## Setup

### Backend env
<!-- copy backend/.env.example → backend/.env, fill values -->

### Frontend env
<!-- copy frontend/.env.example → frontend/.env, fill values -->

### Supabase
<!-- run migrations, create private storage bucket, disable email confirmation -->

### Run
<!-- backend + frontend dev commands -->

## Scripts

<!-- dev / test / lint per package -->

## Security

<!-- filled during M11: secrets, auth enforcement, RLS, input validation,
     file-upload security, HTTP hardening, rate limiting, injection safety,
     error handling, PII minimization, dependency hygiene (SEC-1..11) -->

## Threat model

<!-- what we defend against (cross-account access, secret leakage, malicious
     uploads, AI cost abuse, prompt injection) and known Phase-1 gaps -->

## Phase 2 seams

<!-- plan/credits on profile + single "allowed to run?" checkpoint;
     Razorpay extension points. No billing code in Phase 1. -->
