# Guidely — Product Requirements Document (PRD)

| | |
|---|---|
| **Product** | Guidely |
| **Document type** | Product Requirements Document |
| **Version** | 1.0 (Phase 1) |
| **Owner** | Yash |
| **Audience** | Builder + Claude Code (engineering-focused) |
| **Status** | Draft for build |
| **Last updated** | 2026-08-24 |

---

## 1. Overview

**Guidely** is a web app that helps job seekers make smarter application decisions and apply with materials that actually get past screening. A user provides a **job description (JD)** and their **current resume**, and Guidely returns:

1. An **ATS match score** (0–100) with a clear breakdown of what's driving it.
2. A **recommendation** — *Apply*, *Apply after tailoring*, or *Probably skip* — with an honest rationale.
3. A **tailored, ATS-optimized CV** for that specific job, previewable on screen and downloadable as a PDF.
4. A set of **predicted interview questions** with prep guidance, tailored to the JD and the user's background.

Users sign in, and every analysis, resume, generated CV, and interview-prep set is saved to their account for later reference.

This document specifies **Phase 1** in depth and outlines Phase 2 (payments) and later ideas at a higher level.

## 2. Problem & motivation

Job seekers waste enormous effort in three predictable ways:

- **Applying to the wrong roles.** People apply broadly without a clear read on fit, burning time on jobs where they'll be auto-screened out.
- **Generic resumes that fail ATS.** Applicant Tracking Systems rank resumes by keyword and skill match. A strong candidate with a poorly-matched resume gets filtered before a human ever looks.
- **Walking into interviews underprepared.** Candidates don't know which questions are likely, given the specific role and their own background.

Guidely compresses "should I apply, how do I get past the filter, and how do I prepare" into a single guided flow, so effort goes to the right jobs with the right materials.

## 3. Goals & non-goals

### 3.1 Phase 1 goals

- Give a user a **trustworthy, explainable ATS score** for a resume against a specific JD.
- Give a **clear, honest apply/skip recommendation** rather than always saying "apply."
- Produce a **tailored CV that improves match without fabricating** the user's history.
- Produce **useful, role-specific interview questions** with concise prep guidance.
- Persist a user's work behind **secure authentication** so they can return to it.
- Be **secure by default** and **clean/simple** to use.

### 3.2 Non-goals (Phase 1)

- No payments, subscriptions, or usage billing (that's Phase 2).
- No job-board scraping, job search, or auto-apply.
- No cover-letter generation (candidate for a later phase).
- No recruiter/employer side; this is candidate-facing only.
- No mobile native apps; responsive web only.
- No multi-language support beyond English (later consideration).

### 3.3 Success definition

Phase 1 is successful if a user can, in one session, upload a resume + JD and receive a score, a recommendation, a downloadable tailored CV, and interview questions — reliably, quickly, and without any security or data-isolation defects.

## 4. Target users & personas

**Primary user:** an active job seeker applying to multiple roles who wants to spend effort wisely.

- **"Focused switcher" — Ana, mid-career.** Employed, applying selectively to better roles. Wants to know which postings are worth tailoring for and wants a polished, targeted CV fast.
- **"High-volume applicant" — Ravi, early-career.** Applying to many roles. Wants quick apply/skip signals so he stops wasting time on long-shot postings, plus interview prep when he does apply.
- **"Career changer" — Meera.** Moving into a new field; her raw resume matches poorly on keywords. Needs help surfacing transferable experience honestly and knowing where the real gaps are.

## 5. Product scope & phases

- **Phase 1 (this PRD, build now):** Accounts, resume upload + parsing, ATS scoring, apply/skip recommendation, tailored CV with PDF export, interview prep, saved history, analytics.
- **Phase 2 (outlined, §16):** Razorpay payments, plans/credits, usage quotas.
- **Future (outlined, §17):** cover letters, application tracking, job-board integrations, and more.

## 6. User flows

### 6.1 First-time user (happy path)

1. User lands on the marketing/home screen → clicks **Get started**.
2. **Sign up** with email/password (and/or Google) via Supabase Auth. **No email verification** — email confirmation is disabled, so the account is usable immediately.
3. Is taken **directly to the home page** (no "check your email" or interstitial step) — an empty-state home prompting a first analysis.
4. Clicks **New analysis** → **uploads resume** (PDF/DOCX) and **pastes the job description**.
5. Backend validates + parses the resume, runs the analysis, and returns results.
6. User sees the **results screen**: ATS score + breakdown, recommendation + rationale.
7. User clicks **Build tailored CV** → sees an on-screen preview → **downloads the PDF**.
8. User clicks **Prepare for interview** → sees predicted questions grouped by type with guidance.
9. Everything is saved; the analysis appears in **History** on the home page.

### 6.2 Returning user

1. **Log in** → taken **directly to the home page**, which shows past analyses (job title/company, score, date, recommendation).
2. Opens a saved analysis to review results, re-download the CV, or revisit interview prep.
3. Starts a new analysis at any time.

### 6.3 Error / edge flows

- Unsupported or corrupt file → clear inline error; nothing stored.
- File too large / wrong type → rejected before upload completes, with guidance.
- AI service slow or failing → graceful loading states, timeout, and a retry option; no partial/garbled results shown.
- Empty or too-short JD/resume → validation prompt asking for more content.
- Session expired → redirect to login, preserving intent where feasible.

## 7. Functional requirements

Requirements use IDs (FR-x). Each has acceptance criteria (AC) that should be testable. "The system" = Guidely.

### 7.1 Authentication & accounts

- **FR-1 Sign up / sign in.** Users can create an account and sign in via Supabase Auth (email/password; Google OAuth optional but recommended). **Email verification is disabled** — no confirmation email is sent and the account works immediately. On successful sign-up or log-in, the user is taken **directly to the home page**.
  - AC: A new user can register, log in, and land on the home page without any email-confirmation step. Invalid credentials are rejected with a generic error.
- **FR-2 Session management.** Authenticated sessions use Supabase-issued tokens; the frontend attaches the access token to API calls.
  - AC: Protected API routes reject requests with missing/expired/invalid tokens (HTTP 401). Logout clears the session.
- **FR-3 Account data isolation.** A user can only ever access their own resumes, analyses, CVs, and prep.
  - AC: With two test accounts, user A cannot read or modify any of user B's rows or files (enforced by RLS — see §11).
- **FR-4 Account deletion (data).** A user's data can be fully deleted on request.
  - AC: A deletion routine removes the user's rows and stored files. (UI for this may be minimal in Phase 1, but the capability must exist.)

### 7.2 Resume upload & parsing

- **FR-5 Upload.** Users upload a resume as **PDF or DOCX**.
  - AC: Only PDF/DOCX are accepted; type is verified by **magic bytes**, not just extension/MIME. Files above the configured size limit are rejected. Rejections are clear and no file is stored.
- **FR-6 Parse to text.** The system extracts plain text from the uploaded file for analysis.
  - AC: Text is extracted from typical PDFs and DOCX files. Parsing failures produce a clear error and do not crash the request. Parsing is resource-bounded (guards against malformed-file / zip-bomb DoS).
- **FR-7 Store securely.** The original file is stored in a **private** Supabase Storage bucket under the user's ID; extracted text is stored on the `resumes` row.
  - AC: Files are not publicly accessible; access requires the owner's authorization. Stored filenames are randomized.

### 7.3 ATS scoring & analysis

- **FR-8 ATS score.** Given resume text + JD, the system produces an **overall ATS match score (0–100)** plus sub-scores.
  - Scoring is a **hybrid**: deterministic keyword/skill coverage provides a stable base; the AI model assists with skill/keyword extraction from the JD and qualitative assessment. Suggested sub-dimensions: **hard-skill/keyword coverage**, **experience & title alignment**, **education/certifications match**, and **formatting/ATS-readability**.
  - AC: The same inputs produce stable, explainable results. The score is accompanied by the sub-scores that compose it.
- **FR-9 Breakdown & gaps.** The system lists **matched keywords/skills**, **missing keywords/skills**, and **formatting red flags** (e.g. content that ATS parsers commonly mishandle).
  - AC: Missing keywords are drawn from the JD and genuinely absent from the resume. The breakdown is understandable to a non-expert.
- **FR-10 Explainability.** Every score is accompanied by a short plain-language explanation of what drove it.
  - AC: No score is shown without a rationale.

### 7.4 Apply / skip recommendation

- **FR-11 Recommendation.** The system outputs one of: **Apply**, **Apply after tailoring**, or **Probably skip**, with a short rationale and the top gaps.
  - AC: The recommendation is consistent with the score and gaps (e.g. a low score does not yield an unqualified "Apply"). The rationale is honest and specific, not generic encouragement.

### 7.5 Tailored CV generation

- **FR-12 Generate tailored CV.** The system produces a job-specific, ATS-optimized version of the resume that reorders/rephrases/emphasizes the user's **real** content to better match the JD.
  - AC: The tailored CV introduces **no fabricated** employers, titles, dates, degrees, or credentials. Any recommended additions the user doesn't yet have are shown as clearly-labeled **suggestions**, separate from the CV itself.
- **FR-13 On-screen preview.** The tailored CV is previewed in the browser in a clean, readable layout.
  - AC: Preview reflects the content that will be exported.
- **FR-14 PDF export.** The user can download the tailored CV as an **ATS-friendly PDF** (selectable text, simple single-column layout, standard fonts — no images/tables that break parsers).
  - AC: The downloaded PDF opens correctly, contains selectable text, and matches the preview.

### 7.6 Interview preparation

- **FR-15 Predicted questions.** The system generates interview questions tailored to the JD + resume, grouped by type: **technical/role-specific**, **behavioral**, and **experience-based**.
  - AC: Questions reference the actual role/skills and the user's background rather than being generic.
- **FR-16 Guidance.** Each question includes concise prep guidance; behavioral questions use a **STAR-style** framing prompt.
  - AC: Guidance is actionable and specific, not filler.

### 7.7 History & persistence

- **FR-17 Saved analyses.** Completed analyses (score, breakdown, recommendation, CV reference, prep) are saved and listed on the home page.
  - AC: A returning user sees prior analyses with job label, date, score, and recommendation, and can reopen any of them.
- **FR-18 Re-download / revisit.** Users can re-open a saved analysis to re-download the CV and review prep without re-running the analysis.
  - AC: Reopening does not require re-uploading or re-paying (no cost in Phase 1) and does not re-call the AI unnecessarily.

### 7.8 Analytics

- **FR-19 Event tracking.** The system tracks key product events (see §12) via PostHog, **without** sending resume text, JD text, or PII.
  - AC: Verified event payloads contain only non-sensitive metadata. A basic opt-out is respected.

## 8. AI requirements (NVIDIA Nemotron)

- **AI-1 Provider.** All AI features use **NVIDIA Nemotron** via NVIDIA's OpenAI-compatible endpoint (`https://integrate.api.nvidia.com/v1`), called **only from the backend** using the `openai` SDK pointed at that base URL. The model id is configurable via `NVIDIA_MODEL`; confirm the current best-fit Nemotron model from NVIDIA's catalog as the default.
- **AI-2 Structured output.** Scoring, recommendation, and interview questions must be returned as **strict JSON** matching defined schemas (see Appendix A). Responses are validated with `zod`; malformed output is retried or surfaced as a clean error — never rendered raw.
- **AI-3 Grounding & honesty.** Prompts must instruct the model to use **only** the provided resume content as fact for the CV, and to separate genuine matches from suggestions/gaps. No invented history.
- **AI-4 Prompt-injection defense.** Resume and JD text are **untrusted**. Wrap them in clearly delimited data sections, instruct the model to treat them as data (not instructions), and never let model output drive code execution, file paths, SQL, or shell. Render output as text only.
- **AI-5 Robustness.** Requests have timeouts, bounded input sizes, and retry-with-backoff for transient failures. AI failures degrade gracefully with a user-facing retry.
- **AI-6 Provider abstraction.** All model calls sit behind one backend service module so the model/provider can be swapped without touching feature code.

## 9. Data model (Supabase / Postgres)

All tables have **RLS enabled** with policies scoping rows to the owner (`auth.uid() = user_id`). Provide as SQL migrations under `supabase/`.

- **profiles** — `id` (=auth user id), `display_name`, `plan` (default `free`, reserved for Phase 2), `created_at`.
- **resumes** — `id`, `user_id`, `original_filename`, `storage_path`, `extracted_text`, `created_at`.
- **analyses** — `id`, `user_id`, `resume_id` (FK), `job_description` (text), `ats_score` (int), `score_breakdown` (jsonb), `recommendation` (enum: `apply` | `tailor` | `skip`), `rationale` (text), `created_at`.
- **generated_cvs** — `id`, `user_id`, `analysis_id` (FK), `tailored_content` (jsonb/text), `pdf_storage_path`, `created_at`.
- **interview_preps** — `id`, `user_id`, `analysis_id` (FK), `questions` (jsonb), `created_at`.

**Storage:** one **private** bucket; objects namespaced by `user_id`; storage policies mirror row ownership. Foreign keys cascade appropriately so account/data deletion is clean.

## 10. Non-functional requirements

- **NFR-1 Performance.** A full analysis (parse + score + recommendation) should typically complete within a few seconds of model latency; the UI shows clear progress and never blocks silently. CV and interview-prep generation may run as separate steps so the first results appear quickly.
- **NFR-2 Reliability.** Transient AI/storage failures are retried; the user is never shown partial or corrupted output. Errors are logged server-side with enough detail to debug.
- **NFR-3 Scalability.** Stateless backend suitable for horizontal scaling; heavy work (AI calls) is per-request and rate-limited; no in-memory user state.
- **NFR-4 Usability & accessibility.** Clean, minimal UI (Tailwind + shadcn/ui). One primary action per screen, keyboard navigable, labeled inputs, visible focus states, adequate contrast, responsive down to mobile widths.
- **NFR-5 Maintainability.** Plain JavaScript across frontend and backend (no TypeScript); to compensate for the lack of compile-time types, enforce **runtime input validation (zod) everywhere** and cover critical logic with tests; clear module boundaries; small dependency surface.
- **NFR-6 Cost control.** AI endpoints are rate-limited and input-size-bounded; results are cached/persisted so revisiting a saved analysis doesn't re-call the model.
- **NFR-7 Observability.** Health endpoint; structured server logs (no secrets/PII); product analytics via PostHog.

## 11. Security & privacy requirements

Security is a first-class acceptance criterion, not a later pass. (Mirrors and expands the build prompt's checklist.)

- **SEC-1 Secret handling.** `.env` is git-ignored from the first commit; only `.env.example` is committed. **Backend-only secrets:** `NVIDIA_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, JWT verification secret. **Intentionally public (client) keys:** `SUPABASE_ANON_KEY`, `POSTHOG_KEY` — these are safe to expose **only because RLS is enforced**. Env is validated at startup (zod) and the app fails fast if misconfigured. Secrets are never logged.
- **SEC-2 Authentication enforcement.** Every protected route verifies the Supabase JWT server-side and derives `user_id` from the token — never from client input.
- **SEC-3 Authorization / RLS.** RLS is enabled on **every** table and the storage bucket; policies restrict access to the owner. Cross-account access is impossible (explicitly tested).
- **SEC-4 Input validation.** Every request body/param/query is validated and sanitized with zod; unexpected input is rejected.
- **SEC-5 File-upload security.** PDF/DOCX only; strict size cap; magic-byte type verification; randomized stored names; per-user storage paths; resource-bounded parsing; temp files deleted after parsing.
- **SEC-6 HTTP hardening.** `helmet`, strict CORS allowlist (only `FRONTEND_ORIGIN`), `x-powered-by` disabled, HTTPS assumed in production.
- **SEC-7 Rate limiting & abuse.** Global rate limits with stricter limits on auth and AI endpoints; per-user throttling to control cost and abuse.
- **SEC-8 Injection safety.** Parameterized queries / Supabase client only (no string-built SQL); React output escaping; sanitize any rendered HTML; prompt-injection defenses per §8.
- **SEC-9 Error handling.** Central error handler; generic client messages; detailed server logs; no stack traces, secrets, or PII returned to the client; request bodies containing resume/JD text are not logged.
- **SEC-10 Privacy / PII.** Minimize stored PII; do not send resume/JD/PII to analytics; make user-data deletion straightforward; document what is stored and why.
- **SEC-11 Dependencies.** Small, pinned dependency set; `npm audit` run and criticals resolved.

**Threat model (summary).** Primary risks: cross-account data access (mitigated by RLS + server-side auth), secret leakage (mitigated by env discipline + backend-only keys), malicious uploads (mitigated by type/size/magic-byte checks + bounded parsing), AI cost abuse (mitigated by rate limits + quotas seam), and prompt injection via resume/JD (mitigated by treating that text as data). Known Phase-1 gaps to document: no formal pen-test, no WAF, no anomaly detection.

## 12. Analytics & success metrics

**Tracked events (non-PII):** `signup_completed`, `resume_uploaded`, `analysis_completed` (with score bucket + recommendation, no text), `cv_generated`, `cv_downloaded`, `interview_prep_viewed`, `analysis_reopened`.

**Phase-1 KPIs to watch:**

- Activation: % of signups that complete at least one analysis.
- Core value: % of analyses that lead to a CV download.
- Engagement: analyses per active user; interview-prep view rate.
- Retention: return rate within 7/30 days.
- Reliability: analysis success rate; AI error/timeout rate; p95 latency.

## 13. Technical architecture

**Stack at a glance:** frontend in **React JS**, backend in **Express JS on Node.js**, database & auth on **Supabase** (Postgres), analytics via **PostHog**, AI via **NVIDIA Nemotron**. **Plain JavaScript across the whole stack — no TypeScript.**

- **Frontend:** **React (JavaScript / JSX)** + Vite, Tailwind + shadcn/ui, React Router; Supabase JS client for auth; PostHog for analytics; talks only to the Guidely backend for AI/secret-bearing work.
- **Backend:** **Node.js + Express (JavaScript)** API (no server-rendered HTML). Middleware: env validation, helmet, CORS allowlist, rate limiting, JWT verification, central error handler. Service modules for AI (Nemotron), resume parsing, scoring, CV generation, and interview prep.
- **Data/auth:** Supabase (Postgres + Auth + private Storage) with RLS everywhere.
- **AI:** NVIDIA Nemotron via OpenAI-compatible endpoint, backend-proxied.
- **Repo:** monorepo — `frontend/`, `backend/`, `supabase/` (migrations), root `.gitignore`, `.env.example`, `README.md` (setup + security notes + threat model).

See `CLAUDE_CODE_BUILD_PROMPT.md` in this folder for the build-facing version of the stack, env-var list, and secret-handling rules.

## 14. Release plan & milestones

Build incrementally; each milestone has an exit criterion. (Aligned with the build prompt's order.)

1. **Scaffold & safety net** — monorepo, `.gitignore` (first), `.env.example`, README skeleton. *Exit: `.env` cannot be committed; repo runs empty.*
2. **Backend skeleton** — Node.js + Express (JS), env validation, helmet, CORS, rate limiting, error handler, `/health`. *Exit: health check passes; bad env fails fast.*
3. **Supabase** — schema + RLS + private bucket + JWT middleware. *Exit: cross-account access blocked in tests.*
4. **Frontend skeleton** — Vite/React (JS), Tailwind + shadcn/ui, auth pages (**email verification disabled; redirect to home page after auth**), protected routes, PostHog init. *Exit: user can sign up, log in, and land on the home page; log out works.*
5. **Resume upload + parsing** — with full upload security. *Exit: valid files parse & store; invalid files rejected safely.*
6. **ATS analysis** — Nemotron scoring returning validated JSON + results UI. *Exit: score + breakdown render from real inputs.*
7. **Apply/skip recommendation** — surfaced with rationale. *Exit: recommendation consistent with score/gaps.*
8. **Tailored CV** — generation + preview + PDF export. *Exit: downloadable ATS-friendly PDF matches preview; no fabrication.*
9. **Interview prep** — questions + guidance UI. *Exit: role-specific questions render.*
10. **Analytics** — events wired. *Exit: events fire with no PII.*
11. **Security hardening pass** — checklist review, `npm audit`, README security section + threat model, tests for auth/RLS/upload/validation. *Exit: checklist green; tests pass.*
12. **Phase 2 seams** — plan/credits fields + single "allowed to run?" checkpoint; document Razorpay hooks. *Exit: no billing code, but extension points documented.*

## 15. Risks & open questions

- **ATS-score fidelity.** Real ATS systems vary; our score is a well-reasoned proxy, not a guarantee. *Mitigation:* frame it as guidance, keep methodology transparent, refine weights over time.
- **AI variability/cost.** Model output can vary and costs money. *Mitigation:* structured JSON + validation, deterministic base for scoring, caching/persistence, rate limits.
- **PDF fidelity.** ATS-friendly PDF must stay simple and parseable. *Mitigation:* single-column, standard fonts, selectable text; test extraction on the output.
- **Parsing coverage.** Unusual resume layouts may parse poorly. *Mitigation:* clear errors, allow re-upload, consider paste-fallback later.
- **Open questions:** Google OAuth in Phase 1 or later? Default `NVIDIA_MODEL` choice (confirm from catalog)? Data-retention window for stored resumes? *(Resolved: email verification is off, and users go straight to the home page after sign-up/log-in.)*

## 16. Phase 2 — outline (not built now)

- **Payments:** Razorpay integration for one-time and/or subscription plans.
- **Plans & credits:** `plan`/`credits` on the profile; free tier with limited analyses, paid tiers with more.
- **Quotas:** a single server-side checkpoint ("is this user allowed to run another analysis?") already seamed in Phase 1, enforced here.
- **Billing UX:** upgrade/manage-plan screens, receipts, webhook handling for payment status.
- *Guardrail:* no Razorpay SDK, keys, or billing code in Phase 1 — only the seams above.

## 17. Future ideas — outline

- **Cover-letter generation** tailored to the JD.
- **Application tracker** (statuses, follow-ups, deadlines).
- **Job-board integrations / import** (paste a URL to pull the JD).
- **Multiple resume versions** and A/B comparison.
- **Skill-gap learning suggestions** for "skip"/"tailor" outcomes.
- **Team/coach mode**, exports, and localization.

## Appendix A — Example AI output schemas

These are indicative shapes the backend should validate before use.

**Analysis (scoring + recommendation):**

```json
{
  "ats_score": 0,
  "sub_scores": {
    "keyword_skill_coverage": 0,
    "experience_title_alignment": 0,
    "education_certifications": 0,
    "formatting_readability": 0
  },
  "matched_keywords": ["string"],
  "missing_keywords": ["string"],
  "formatting_flags": ["string"],
  "recommendation": "apply | tailor | skip",
  "rationale": "string",
  "top_gaps": ["string"]
}
```

**Tailored CV:**

```json
{
  "summary": "string",
  "sections": [
    { "heading": "string", "items": ["string"] }
  ],
  "suggested_additions": ["string (clearly separate from real content)"]
}
```

**Interview prep:**

```json
{
  "groups": [
    {
      "type": "technical | behavioral | experience",
      "questions": [
        { "question": "string", "guidance": "string" }
      ]
    }
  ]
}
```

## Appendix B — Glossary

- **ATS** — Applicant Tracking System; software that screens/ranks resumes, often by keyword/skill match.
- **RLS** — Row Level Security; Postgres feature (used via Supabase) that restricts row access per policy so users only see their own data.
- **JD** — Job Description.
- **STAR** — Situation, Task, Action, Result; a structure for answering behavioral interview questions.

---

*Companion file: `CLAUDE_CODE_BUILD_PROMPT.md` (build-facing instructions for Claude Code).*
