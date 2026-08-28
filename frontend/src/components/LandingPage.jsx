import { Link } from 'react-router-dom';
import { SEO } from './SEO';

const steps = [
  {
    num: '01',
    title: 'Paste your resume & job description',
    body: 'Upload a PDF or paste text. We parse it instantly.',
  },
  {
    num: '02',
    title: 'Get your ATS match score',
    body: 'See exactly how your resume ranks against the job — skills, experience, keywords, education.',
  },
  {
    num: '03',
    title: 'Download a tailored version',
    body: 'Get a restructured resume & cover letter optimized for this specific role.',
  },
];

export function LandingPage() {
  return (
    <>
      <SEO
        title="Guidely – ATS Resume Scoring"
        description="See how your resume scores against any job description. Get a tailored version in seconds."
        keywords="ATS resume score, resume checker, job match score"
        canonical="https://guidely.app"
      />

      <div className="min-h-screen bg-[#080a12] text-[#f7f2ed]">
        {/* ── Hero ─────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(114,33,70,0.4),transparent_50%)]" />

          <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
            {/* Nav */}
            <nav className="flex items-center justify-between mb-20 sm:mb-28">
              <Link to="/" className="flex items-center gap-2.5">
                <svg className="h-8 w-8" viewBox="0 0 36 36" fill="none">
                  <rect x="1" y="1" width="34" height="34" rx="10" stroke="#f27db8" strokeWidth="1.5" fill="rgba(31,31,46,0.92)" />
                  <path d="M18 9C13.03 9 9 13.03 9 18s4.03 9 9 9c3.14 0 5.88-1.61 7.48-4.05" stroke="#f27db8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <circle cx="23" cy="13" r="2" fill="#f27db8" />
                </svg>
                <span className="text-base font-bold tracking-tight">guidely</span>
              </Link>

              <div className="flex items-center gap-5">
                <Link to="/login" className="text-sm text-[#b8b5bd] hover:text-white transition-colors">
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-full bg-[#f575ad] px-5 py-2 text-sm font-semibold text-[#0f1217] hover:opacity-90 transition-opacity"
                >
                  Get started
                </Link>
              </div>
            </nav>

            {/* Headline */}
            <div className="max-w-3xl">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#f575ad] mb-5">
                ATS resume scoring
              </p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
                Know your score<br />
                <span className="text-[#f575ad]">before you apply.</span>
              </h1>
              <p className="mt-6 text-lg text-[#b8b5bd] max-w-xl leading-relaxed">
                Paste any job description & resume. Get an instant ATS match score, keyword gaps, and a tailored version ready to send.
              </p>

              <div className="mt-8 flex items-center gap-3">
                <Link
                  to="/signup"
                  className="rounded-full bg-[#f575ad] px-6 py-3 text-sm font-semibold text-[#0f1217] hover:opacity-90 transition-opacity"
                >
                  Try it free
                </Link>
                <Link
                  to="/dashboard"
                  className="rounded-full border border-white/10 px-6 py-3 text-sm font-medium text-[#f7f2ed] hover:bg-white/5 transition-colors"
                >
                  See demo
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works ─────────────────────────────── */}
        <section className="border-t border-white/[0.04]">
          <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#6b6e78] mb-3">
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-14">
              Three steps. No fluff.
            </h2>

            <div className="grid gap-10 sm:grid-cols-3">
              {steps.map((step) => (
                <div key={step.num}>
                  <span className="text-xs font-mono text-[#f575ad]">{step.num}</span>
                  <h3 className="mt-2 text-base font-semibold leading-snug">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#b8b5bd] leading-relaxed">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What You Get ─────────────────────────────── */}
        <section className="border-t border-white/[0.04]">
          <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
            <div className="grid gap-12 lg:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#6b6e78] mb-3">
                  Score breakdown
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Not just a number.<br />A breakdown.
                </h2>
                <p className="mt-4 text-[#b8b5bd] leading-relaxed">
                  Skills match, experience alignment, keyword coverage, education fit — each scored individually so you know exactly where to improve.
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-[rgba(18,20,28,0.6)] p-6">
                <div className="space-y-4">
                  {[
                    { label: 'Skills', score: 85 },
                    { label: 'Experience', score: 72 },
                    { label: 'Keywords', score: 68 },
                    { label: 'Education', score: 90 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-[#b8b5bd]">{item.label}</span>
                        <span className="font-medium">{item.score}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#f575ad]"
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────── */}
        <section className="border-t border-white/[0.04]">
          <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Stop guessing. Start scoring.
            </h2>
            <p className="mt-4 text-[#b8b5bd] max-w-md mx-auto">
              Free to try. No credit card required.
            </p>
            <Link
              to="/signup"
              className="mt-8 inline-block rounded-full bg-[#f575ad] px-8 py-3.5 text-sm font-semibold text-[#0f1217] hover:opacity-90 transition-opacity"
            >
              Get your score
            </Link>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────── */}
        <footer className="border-t border-white/[0.04]">
          <div className="mx-auto max-w-5xl px-6 py-8 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <svg className="h-6 w-6" viewBox="0 0 36 36" fill="none">
                <rect x="1" y="1" width="34" height="34" rx="10" stroke="#f27db8" strokeWidth="1.5" fill="rgba(31,31,46,0.92)" />
                <path d="M18 9C13.03 9 9 13.03 9 18s4.03 9 9 9c3.14 0 5.88-1.61 7.48-4.05" stroke="#f27db8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <circle cx="23" cy="13" r="2" fill="#f27db8" />
              </svg>
              <span className="text-sm font-bold tracking-tight">guidely</span>
            </Link>
            <p className="text-xs text-[#6b6e78]">© 2026 Guidely</p>
          </div>
        </footer>
      </div>
    </>
  );
}
