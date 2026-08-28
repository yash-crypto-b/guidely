import { SEO } from './SEO';
import { Link } from 'react-router-dom';

export function SupportPage() {
  return (
    <>
      <SEO
        title="Support — Guidely"
        description="Get help with Guidely. Contact our support team or browse frequently asked questions."
        canonical="https://guidely.app/support"
        noIndex={true}
      />

      <div className="min-h-screen bg-gray-50 dark:bg-[#080a12] text-gray-900 dark:text-[#f7f2ed]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <Link to="/" className="text-sm text-[#f575ad] hover:underline mb-8 inline-block">
            ← Back to home
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Support
          </h1>
          <p className="text-[#b8b5bd] mb-12">
            Need help? Here's how to reach us.
          </p>

          <div className="space-y-8">
            {/* Contact */}
            <div className="rounded-[20px] border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[rgba(18,20,28,0.82)] p-6">
              <h2 className="text-lg font-bold mb-3">Contact Us</h2>
              <p className="text-sm text-gray-600 dark:text-[#b8b5bd] mb-4">
                For general questions, bug reports, or feature requests, email us at:
              </p>
              <a
                href="mailto:support@guidely.app"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#f575ad] hover:underline"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                support@guidely.app
              </a>
            </div>

            {/* Security */}
            <div className="rounded-[20px] border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[rgba(18,20,28,0.82)] p-6">
              <h2 className="text-lg font-bold mb-3">Security Issues</h2>
              <p className="text-sm text-gray-600 dark:text-[#b8b5bd] mb-4">
                Found a security vulnerability? Please report it responsibly:
              </p>
              <a
                href="mailto:security@guidely.dev"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#f575ad] hover:underline"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                security@guidely.dev
              </a>
              <p className="text-xs text-gray-400 dark:text-[#6b6e78] mt-3">
                Do not create public GitHub issues for security vulnerabilities.
              </p>
            </div>

            {/* FAQ */}
            <div className="rounded-[20px] border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[rgba(18,20,28,0.82)] p-6">
              <h2 className="text-lg font-bold mb-3">Common Questions</h2>
              <div className="space-y-4 text-sm text-gray-600 dark:text-[#b8b5bd]">
                <div>
                  <p className="font-medium text-gray-900 dark:text-[#f7f2ed]">My analysis failed with an error</p>
                  <p className="mt-1">Try again in a moment — our AI service may be temporarily overloaded. If the issue persists, email us with a description of what you were doing.</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-[#f7f2ed]">I can't upload my resume</p>
                  <p className="mt-1">We accept PDF and plain text files up to 5MB. Scanned image PDFs may not work — the file must contain selectable text.</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-[#f7f2ed]">How do I delete my account?</p>
                  <p className="mt-1">Go to Profile → Account Settings → Delete Account. This will permanently remove all your data.</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-[#f7f2ed]">Is my data secure?</p>
                  <p className="mt-1">Your resume and job descriptions are encrypted in transit and processed only to generate your analysis. We do not sell your data. See our <Link to="/privacy" className="text-[#f575ad] hover:underline">Privacy Policy</Link> for details.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SupportPage;
