# Guidely — Production Page Audit

**Date:** August 28, 2026
**Auditor:** Automated audit (Buffy/Codebuff)

---

## 1. Project Detected

| Property | Value |
|----------|-------|
| Application type | SaaS web app — ATS resume scoring + tailored CV generation |
| Technology stack | React 19 (Vite, Tailwind 4), Express 5 (Node 20+), Supabase (Postgres + Auth + Storage) |
| Authentication model | Supabase Auth — email/password, email verification disabled |
| Payment/business model | Free tier (Phase 1). Phase 2 will add Razorpay payments. No payments exist yet. |
| Important user roles | Authenticated user (single role) |
| Data-sensitive features | Resume text upload, job description text, PDF file upload, AI-generated analysis |

**Key file paths:**
- Frontend entry: `frontend/src/App.jsx`
- Landing: `frontend/src/components/LandingPage.jsx`
- Auth: `frontend/src/components/AuthScreen.jsx`
- Dashboard: `frontend/src/components/Home.jsx`
- Backend entry: `backend/src/index.js`
- Backend routes: `backend/src/routes/analysis.js`, `backend/src/routes/stats.js`, `backend/src/routes/me.js`
- Auth middleware: `backend/src/middleware/auth.js`
- Env config: `backend/src/config/env.js`

---

## 2. Audit Results

| Category | Page or state | Status | Evidence | Applicability reason | Required action |
|----------|--------------|--------|----------|---------------------|-----------------|
| Legal | Privacy Policy | EXISTS_NEEDS_IMPROVEMENT | `frontend/src/components/PrivacyPolicy.jsx`, route `/privacy` | Collects email, resume text, job descriptions, usage data. Uses Supabase, NVIDIA AI, Google Analytics (claimed but not verified in code). Current policy has generic/template content. | Update to match actual data practices: no Google Analytics in code, Supabase is auth+storage, NVIDIA is AI provider. Add actual data retention info. |
| Legal | Terms of Service | APPLICABLE_MISSING | No file exists. No route. | Public SaaS service with user accounts. Terms are standard practice. | Create Terms of Service page with route. |
| Legal | Cookie Policy | EXISTS_NEEDS_IMPROVEMENT | `PrivacyPolicy.jsx` section 8 mentions "essential cookies" | App uses Supabase auth tokens (localStorage/sessionStorage). Theme preference stored in localStorage. No cookie consent banner. | Update Privacy Policy's cookie section. Cookie Policy can be a subsection. |
| Legal | Cookie Preferences | NOT_APPLICABLE | No analytics/tracking cookies found in code. Supabase uses localStorage, not cookies. | No third-party tracking or analytics cookies detected in the codebase. | None — no consent banner needed. |
| Legal | Refund Policy | NOT_APPLICABLE | PRD §3.2 explicitly states "No payments, subscriptions, or usage billing" in Phase 1. No payment code exists. | No payments exist in the application. | None until Phase 2. |
| Legal | Cancellation Policy | NOT_APPLICABLE | No subscriptions or billing. | No paid plans exist. | None until Phase 2. |
| Legal | Shipping Policy | NOT_APPLICABLE | Digital-only product. No physical goods. | Purely digital SaaS. | None. |
| Legal | Return/Exchange Policy | NOT_APPLICABLE | Digital-only product. No physical goods. | Purely digital SaaS. | None. |
| Legal | Disclaimer | EXISTS_NEEDS_IMPROVEMENT | PRD §15 states "Our score is a well-reasoned proxy, not a guarantee." No disclaimer on the site. | ATS score is informational; users should know it's not a guarantee of ATS pass rates. | Add disclaimer to landing page CTA and/or results page. |
| Legal | Accessibility Statement | APPLICABLE_MISSING | No accessibility statement exists. | Public-facing product. Statement should acknowledge current state honestly. | Create minimal accessibility statement. |
| Legal | Data Processing Agreement | NOT_APPLICABLE | B2C product, not B2B. No business customer data processing. | Individual consumers only. | None. |
| Legal | Acceptable Use Policy | APPLICABLE_MISSING | Users upload resumes and job descriptions. No terms govern acceptable use. | User-generated content (uploads) + API usage. | Add acceptable use clause to Terms of Service. |
| Legal | Security Policy | EXISTS_AND_ADEQUATE | `SECURITY.md` exists with vulnerability reporting process. | Proper security policy with contact email and disclosure timeline. | None — retained as-is. |
| Legal | Responsible Disclosure | EXISTS_AND_ADEQUATE | `SECURITY.md` includes responsible disclosure process. | Already in security policy. | None — retained as-is. |
| Legal | Community Guidelines | NOT_APPLICABLE | No social features, messaging, comments, reviews, or community features. | Single-user product with no social interaction. | None. |
| Lifecycle | Login | EXISTS_AND_ADEQUATE | `AuthScreen.jsx`, route `/login`. Supabase email/password. Proper error handling. | Email/password auth works. No issues. | None. |
| Lifecycle | Register | EXISTS_AND_ADEQUATE | `AuthScreen.jsx` has sign-up tab. Email verification disabled per PRD. | Registration works end-to-end. | None. |
| Lifecycle | Email Verification | NOT_APPLICABLE | PRD §6.1 explicitly states "email verification is disabled." No email confirmation flow exists. | By design — users go straight to dashboard. | None. |
| Lifecycle | Forgot Password | APPLICABLE_MISSING | `AuthScreen.jsx` has a "Forgot password?" button that does nothing (no onClick handler, no route). | Button exists but has zero functionality. Users with forgotten passwords are stuck. | Implement Supabase password reset email flow. |
| Lifecycle | Reset Password | APPLICABLE_MISSING | No `/reset-password` route. No backend support. | Required to complete the forgot password flow. | Create reset password page + route. Supabase handles token verification. |
| Lifecycle | Onboarding | NOT_APPLICABLE | PRD §6.1 says user goes "directly to the home page" after signup. No onboarding needed for this simple product. | Product is self-explanatory. | None. |
| Lifecycle | Account Settings | EXISTS_NEEDS_IMPROVEMENT | `ProfilePage.jsx`, route `/profile`. Shows email, account creation date, dark mode toggle, sign out. | Minimal but functional. Missing: password change, account deletion (required by GDPR and PRD FR-4). | Add password change and account deletion. |
| Lifecycle | Billing | NOT_APPLICABLE | PRD §3.2: "No payments, subscriptions, or usage billing." No payment code exists. | Phase 1 is free. | None until Phase 2. |
| Lifecycle | Upgrade/Downgrade | NOT_APPLICABLE | No subscription plans exist. | Free tier only. | None until Phase 2. |
| Lifecycle | Cancel Subscription | NOT_APPLICABLE | No subscriptions exist. | Free tier only. | None until Phase 2. |
| Lifecycle | Payment Success/Failed/Pending | NOT_APPLICABLE | No payment integration exists. | No Razorpay or any payment code. | None until Phase 2. |
| Lifecycle | Support | APPLICABLE_MISSING | No support page or contact form. `FAQ.jsx` exists but is not routed anywhere. | Users need a way to get help. | Create support page with contact info and route it. |
| Lifecycle | Help Center | NOT_APPLICABLE | FAQ component exists (`FAQ.jsx`) but is unused. For a Phase 1 product, a FAQ section suffices. | FAQ exists as a component. | Could be routed, but not critical for Phase 1. |
| UX States | 404 | EXISTS_NEEDS_IMPROVEMENT | `App.jsx` catch-all: `<Route path="*" element={<Navigate to="/" replace />} />` | Silently redirects to home — no indication the page doesn't exist. Confusing for users. | Create proper 404 page with explanation and navigation. |
| UX States | 403 | NOT_APPLICABLE | Single-role app. No admin panel. Auth middleware handles 401. | No permission denied scenarios in Phase 1. | None. |
| UX States | 500 | EXISTS_NEEDS_IMPROVEMENT | Backend `error.js` returns generic message in production. Frontend shows "Something went wrong" toast. | Backend handles 500. Frontend has basic error states but no full-page error UI. | Add client-side error boundary for unhandled errors. |
| UX States | Maintenance | NOT_APPLICABLE | No maintenance mode configuration exists. | No maintenance endpoint or flag. | Could add but low priority for Phase 1. |
| UX States | Offline | APPLICABLE_MISSING | No offline detection. App shows blank or network errors with no guidance. | SPA should detect connectivity and show a message. | Add basic offline detection + banner. |
| UX States | Empty State | EXISTS_AND_ADEQUATE | `ConnectPage.jsx` shows "No analyses yet" with emoji and description. Dashboard shows form prompt. | Empty states exist and are informative. | None. |
| UX States | No Search Results | NOT_APPLICABLE | No search functionality exists. | No search feature in Phase 1. | None. |
| UX States | Loading State | EXISTS_NEEDS_IMPROVEMENT | `LoadingSkeleton.jsx` exists. `App.jsx` has spinner. Analysis has loading states. | Basic loading exists. `LoadingSkeleton.jsx` is defined but may not be used everywhere. | Verify and enhance loading states. |
| UX States | Error State | EXISTS_NEEDS_IMPROVEMENT | Analysis form shows inline errors. CV/cover letter have error states with retry. | Functional but inconsistent. | Standardize error messaging. |
| UX States | Success State | EXISTS_AND_ADEQUATE | Analysis results show score, breakdown, recommendation. CV download confirms. | Success states are clear. | None. |
| UX States | Session Expired | APPLICABLE_MISSING | No session expiry handling. Auth middleware returns 401 but frontend doesn't detect/catch it gracefully. | Supabase tokens expire after 1 hour. User will get 401 errors with no clear message. | Add interceptor or handler for 401 → redirect to login with message. |

---

## 3. Implementation Plan

### Will implement:
1. **Terms of Service** — real route, real content based on actual app
2. **Forgot Password** — Supabase `resetPasswordForEmail` + reset page
3. **Reset Password** — `/reset-password` route handling Supabase token
4. **404 page** — proper not-found page
5. **Improved Privacy Policy** — corrected to match actual data practices
6. **Session expired handling** — detect 401, redirect with message
7. **Offline detection** — navigator.onLine + event listeners
8. **Disclaimer** — on landing page and results
9. **Footer links** — legal pages reachable from landing + auth
10. **Account deletion** — profile page
11. **Support page** — contact information

### Will NOT implement (with evidence):
- Cookie Preferences/Consent — no tracking cookies in codebase
- Refund/Cancellation/Shipping/Return — no payments (Phase 2)
- Billing/Upgrade/Downgrade/Payment pages — no payments (Phase 2)
- Email Verification — by design, disabled per PRD
- Onboarding — product is self-explanatory per PRD
- Community Guidelines — no social features
- Data Processing Agreement — B2C only
- Help Center — FAQ component exists, sufficient for Phase 1
- Maintenance mode — no infrastructure for it yet
- 403 page — single-role app, no permission scenarios

---

## 4. Missing Owner Information

The following facts are needed for legal pages but cannot be fabricated:

| Item | Needed for | Status |
|------|-----------|--------|
| Legal business/operator name | ToS, Privacy Policy | Unknown — likely individual or not-yet-incorporated |
| Support contact email | ToS, Support page | Unknown — `security@guidely.dev` exists in SECURITY.md |
| Privacy contact email | Privacy Policy | Listed as `privacy@guidely.app` in current policy |
| Registered/operating address | Legal pages | Unknown |
| Applicable jurisdiction | ToS dispute resolution | Unknown |
| Minimum user age | Privacy Policy | Current policy says 13 |
| Effective date for legal pages | All legal pages | Will use August 28, 2026 |
| Third-party sub-processors | Privacy Policy | Supabase, NVIDIA AI (verified in code) |

**Action:** Legal pages will use placeholder contact info marked as needing verification. No fake addresses or business names will be invented.

---

## 5. Verification Results

| Check | Command | Result |
|-------|---------|--------|
| Frontend build | `cd frontend && npx vite build` | PASSED |
| Backend tests | `cd backend && npm test` | PASSED (80 tests) |
| TypeScript | N/A — plain JavaScript per PRD NFR-5 | NOT_RUN (no TS) |
| Linting | N/A — no linter configured | NOT_RUN |
| Accessibility manual check | N/A — no browser tooling | NOT_RUN |

---

*This audit is based on code evidence only. Legal pages require professional review before publication.*
