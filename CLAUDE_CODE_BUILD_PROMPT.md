# Guidely — Claude Code Build Prompt (Phase 1)

> Copy everything inside the horizontal rule below into Claude Code as your kickoff prompt.
> It is written to be handed to Claude Code directly.

---

## Role & goal

You are my senior full-stack engineer. We are building **Guidely**, a job-hunting web app that helps a user decide whether to apply for a job and gives them everything they need to get through screening and interviews.

Work **incrementally**, in small reviewable steps. After each milestone, stop, summarize what you did, and wait for my go-ahead before the next one. Do not scaffold the entire app in one shot. Explain trade-offs when you make a non-obvious choice. Ask me before adding any dependency that isn't listed below.

Prioritize three things above all, in this order: **security**, **clean/simple UX**, and **maintainable code**.

## What the app does (Phase 1)

The user pastes/uploads a **job description** and uploads their **current resume** (PDF or DOCX). The app then:

1. **ATS score** — parses the resume, compares it against the job description, and returns an ATS-match score (0–100) with a clear breakdown (keyword/skill coverage, missing keywords, formatting red flags, experience alignment).
2. **Apply or not** — gives a clear recommendation: **Apply**, **Apply after tailoring**, or **Probably skip** — with a short, honest rationale and the biggest gaps.
3. **Custom tailored CV** — generates an ATS-optimized, job-specific version of the resume. Show a clean **on-screen preview** and let the user **download it as a PDF**. Never invent experience, employers, dates, or credentials the user doesn't have — only rephrase, reorder, and emphasize real content, and clearly mark any suggested additions as "suggested" rather than fabricating them into the CV.
4. **Interview prep** — generates a set of **predicted interview questions** tailored to the JD + resume, grouped by type (technical, behavioral, role-specific), each with concise guidance / talking points (STAR-style for behavioral).

Users **log in** and their past analyses, uploaded resumes, generated CVs, and interview prep are **saved to their account**. Keep auth frictionless: **do not require email verification** — disable Supabase's email confirmation so accounts are usable immediately — and **after a successful sign-up or log-in, take the user directly to the home page** (no "check your email" or interstitial step).

## Tech stack (use exactly this)

- **Frontend:** **React (JavaScript / JSX — no TypeScript)** + **Vite**, **Tailwind CSS**, **shadcn/ui** components. Client routing with React Router. Keep the UI clean, minimal, and uncluttered — generous whitespace, one primary action per screen, a simple neutral palette with a single accent color, accessible (labels, focus states, keyboard nav).
- **Backend:** **Node.js + Express (JavaScript — no TypeScript)**, running as an API server only (no server-rendered HTML). All AI calls and all secret-bearing calls go through the backend.
- **Database & auth:** **Supabase** (Postgres + Supabase Auth). Use **Row Level Security (RLS)** on every table. Store uploaded files in a **private Supabase Storage bucket** (not public).
- **AI:** **NVIDIA Nemotron** via NVIDIA's OpenAI-compatible API. Base URL `https://integrate.api.nvidia.com/v1`, authenticated with `NVIDIA_API_KEY`. Use the official `openai` SDK pointed at that base URL. Make the model name an env var (`NVIDIA_MODEL`); confirm the current best-fit Nemotron model from NVIDIA's model catalog (build.nvidia.com) and set it as the default. All AI requests are proxied through the backend — the NVIDIA key must never reach the browser.
- **Analytics:** **PostHog** (product analytics) on the frontend using the public project key.
- **Payments (Phase 2 — do NOT build now):** **Razorpay**. Only leave clean seams for it (see Phase 2 section). Do not add the SDK or any payment code yet.

Use **plain JavaScript on both ends** — Node.js + Express on the backend, React with JSX on the frontend. **Do not use TypeScript.** Because we lose compile-time type checking, be extra rigorous about runtime input validation (validate every input with `zod`) and write tests for critical logic to catch the bugs that types would otherwise catch.

## Repository structure

Create a monorepo:

```
guidely/
├─ frontend/          # Vite + React (JavaScript/JSX) + Tailwind + shadcn/ui
├─ backend/           # Node.js + Express (JavaScript) API
├─ supabase/          # SQL migrations (schema + RLS policies)
├─ .gitignore         # created FIRST, before any code
├─ .env.example       # documents every env var, with placeholder values only
└─ README.md          # setup, run, and security notes
```

**Before writing any code, create `.gitignore`.** It must ignore at least: `node_modules/`, `dist/`, `build/`, `.env`, `.env.*` (but NOT `.env.example`), `*.local`, coverage output, editor folders (`.vscode/`, `.idea/`), OS files (`.DS_Store`), logs, and any uploaded/temp file directories. Verify `.env` can never be committed.

## Secrets & environment handling (read carefully)

I want secrets kept safe, but be precise about which keys are *meant* to be public vs. private — getting this wrong either breaks the app or leaks a secret:

**Backend `.env` (server-only — NEVER exposed to the browser):**
- `PORT`
- `NODE_ENV`
- `FRONTEND_ORIGIN` (for CORS allowlist)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`  ← highly sensitive, backend only
- `SUPABASE_JWT_SECRET` (or verify tokens via Supabase) — to validate the user's access token on protected routes
- `NVIDIA_API_KEY`  ← backend only
- `NVIDIA_BASE_URL` (default `https://integrate.api.nvidia.com/v1`)
- `NVIDIA_MODEL`
- Rate-limit config (window, max)

**Frontend `.env` (Vite `VITE_` prefix — these ARE shipped to the browser, so put ONLY values that are safe to be public here):**
- `VITE_API_BASE_URL` (the backend URL)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (the anon/publishable key is designed to be public **and is only safe because RLS is enforced** — so RLS is mandatory)
- `VITE_POSTHOG_KEY` (public project key)
- `VITE_POSTHOG_HOST`

Rules: load env with validation at startup (use `zod` to parse `process.env` and fail fast with a clear message if something is missing). Never log secret values. Never hardcode a key. Commit only `.env.example` with placeholders. The NVIDIA key and the Supabase **service role** key must exist only on the backend.

## Data model (Supabase)

Design tables roughly like this (refine as needed), all with RLS so a user can only read/write their **own** rows (`auth.uid() = user_id`):

- `profiles` — one row per auth user (display name, created_at).
- `resumes` — user_id, original filename, storage path, extracted_text, created_at.
- `analyses` — user_id, resume_id, job_description (text), ats_score (int), score_breakdown (jsonb), recommendation (enum: apply / tailor / skip), rationale (text), created_at.
- `generated_cvs` — user_id, analysis_id, tailored_content (jsonb/text), pdf_storage_path, created_at.
- `interview_preps` — user_id, analysis_id, questions (jsonb), created_at.

Provide these as SQL migration files under `supabase/`, including the **RLS policies** and Storage bucket policy (private bucket; users can only access files under their own user id path). Enable RLS on every table explicitly — do not rely on defaults.

## AI integration details

- Put all NVIDIA calls behind a small backend service module (e.g. `services/ai.js`) so the model/provider can be swapped later.
- Use structured prompts and request **JSON output** for scoring, recommendation, and interview questions so the frontend can render reliably. Validate the model's JSON with `zod` before using it; handle malformed output gracefully.
- Treat the resume and JD text as **untrusted input** to the model. Guard against prompt injection: wrap user content in clearly delimited sections, instruct the model to treat that content as data (not instructions), and never let model output drive code execution, file paths, SQL, or shell commands. Render model output as text only.
- Add sensible timeouts, a retry with backoff for transient errors, and a clear user-facing error if the AI call fails. Cap input sizes sent to the model.

## Security requirements (this matters a lot to me — treat as acceptance criteria)

Build these in from the start, not as an afterthought:

1. **Secrets:** as above — `.env` git-ignored, `.env.example` only, secret keys backend-only, env validated at boot.
2. **Auth on the backend:** every protected route verifies the Supabase JWT from the `Authorization: Bearer` header. Reject missing/expired/invalid tokens. Never trust a `user_id` sent from the client — always derive it from the verified token.
3. **RLS everywhere:** every table + the storage bucket. Test that user A cannot read user B's data.
4. **Input validation:** validate and sanitize **every** request body/param/query with `zod`. Reject anything unexpected.
5. **File-upload security:** accept only PDF/DOCX; enforce a strict max file size; verify the real file type by **magic bytes**, not just extension/mime; generate a random stored filename; store in the private bucket under the user's id; never execute or trust file contents; strip/parse safely (watch for zip-bomb / malformed-file DoS in the parser). Delete temp files after parsing.
6. **HTTP hardening:** use `helmet`, a locked-down **CORS** allowlist (only `FRONTEND_ORIGIN`), and disable `x-powered-by`.
7. **Rate limiting:** `express-rate-limit` globally, with stricter limits on auth and on the AI endpoints (they cost money and are abuse targets). Consider a per-user quota.
8. **Injection safety:** use the Supabase client / parameterized queries only — no string-built SQL. React escapes output by default; if any HTML is ever rendered, sanitize it. Guard against the prompt-injection notes above.
9. **Error handling:** central error handler; return generic messages to the client, log details server-side. **Never** leak stack traces, secrets, or PII to the client. Don't log full request bodies containing resume text/PII.
10. **Transport & headers:** assume HTTPS in production; set secure headers; if cookies are ever used, mark them `HttpOnly`, `Secure`, `SameSite`. (We're using Bearer tokens, so note CSRF exposure is low, but document the reasoning.)
11. **Dependencies:** keep the dependency list small; run `npm audit` and fix criticals; pin versions.
12. **Least privilege & PII:** only the backend uses the service role key; store the minimum PII necessary; make it easy to delete a user's data (supports future compliance).

Add a **"Security" section to the README** documenting how each of the above is handled, and a short **threat model** (what we protect against and known gaps).

## Analytics (PostHog)

Initialize PostHog on the frontend with the public key. Track a few meaningful events (e.g. `resume_uploaded`, `analysis_completed`, `cv_downloaded`, `interview_prep_viewed`). Do **not** send resume text, JD text, or any PII to PostHog — events + non-sensitive metadata only. Respect a basic opt-out.

## Phase 2 seams (do NOT implement now — just leave clean hooks)

- Structure the code so a **Razorpay** payment/subscription layer and usage quotas can be added without refactoring (e.g. a `plan`/`credits` concept on the profile, and a single place where "is this user allowed to run another analysis?" is checked).
- Do not add the Razorpay SDK, keys, or any billing UI yet. Just note the extension points in the README.

## Suggested build order (one milestone at a time — pause after each)

1. **Scaffold & safety net:** monorepo layout, `.gitignore` (first!), `.env.example`, README skeleton. Confirm `.env` is ignored.
2. **Backend skeleton:** Node.js + Express (JavaScript), env validation (zod), helmet, CORS allowlist, rate limiting, central error handler, `/health` route.
3. **Supabase:** schema + RLS migrations + private storage bucket policy; backend Supabase client; JWT verification middleware.
4. **Frontend skeleton:** Vite + React (JavaScript) + Tailwind + shadcn/ui; layout; auth (sign up / log in / log out) via Supabase with **email confirmation disabled (no verification email)** and a **redirect straight to the home page on successful sign-up or log-in**; protected routes; PostHog init.
5. **Resume upload + parsing** endpoint with full file-upload security; store file + extracted text.
6. **ATS analysis** endpoint (NVIDIA Nemotron) returning validated JSON; results UI with score + breakdown.
7. **Apply/not recommendation** surfaced in the UI with rationale.
8. **Tailored CV** generation + on-screen preview + **PDF download**.
9. **Interview prep** questions generation + UI.
10. **Analytics events** wired in.
11. **Security hardening pass**: run through the checklist above, run `npm audit`, write the README security section + threat model, add basic tests for auth, RLS behavior, file validation, and input validation.
12. **Phase 2 seams**: add the quota/plan hooks and document Razorpay extension points (no billing code).

## Working agreement

- Small steps; pause for review after each milestone.
- Ask before adding any dependency not listed here.
- Write clear commit-sized changes and tell me what to run to test each step.
- Add tests for security-critical logic (auth, RLS, file validation, input validation).
- If something in these instructions is ambiguous or you think there's a better approach, say so before building.

Start with **Milestone 1** now: propose the exact folder structure and the `.gitignore` + `.env.example` contents, and wait for my approval before writing more.

---
