import { Link } from 'react-router-dom';
import { SEO } from './SEO';

export function PrivacyPolicy() {
  return (
    <>
      <SEO
        title="Privacy Policy — Guidely"
        description="Guidely's privacy policy. Learn how we collect, use, and protect your personal information."
        canonical="https://guidely.app/privacy"
        noIndex={true}
      />

      <div className="min-h-screen bg-gray-50 dark:bg-[#080a12] text-gray-900 dark:text-[#f7f2ed]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <Link to="/" className="text-sm text-[#f575ad] hover:underline mb-8 inline-block">
            ← Back to home
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500 dark:text-[#6b6e78] mb-10">
            Last updated: August 28, 2026
          </p>

          <div className="space-y-10 text-[15px] leading-relaxed text-gray-600 dark:text-[#b8b5bd]">
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                1. Introduction
              </h2>
              <p>
                Guidely ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                2. Information We Collect
              </h2>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-[#f7f2ed] mb-2">
                Account Information
              </h3>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Email address — required for account creation and authentication</li>
                <li>Account creation date</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-[#f7f2ed] mb-2">
                Content You Submit
              </h3>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Resume text — pasted directly or extracted from uploaded PDF/text files</li>
                <li>Job descriptions — text you paste for analysis</li>
                <li>Uploaded files — PDF or text files, processed in memory and not permanently stored on our servers</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-[#f7f2ed] mb-2">
                Usage Information
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Number of analyses performed</li>
                <li>Analysis scores and recommendations (stored to provide your history)</li>
                <li>Server logs — standard access logs for security and debugging (no resume or job description text is logged)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                3. How We Use Your Information
              </h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>To provide and maintain the Service (resume analysis, score generation, tailored resume creation)</li>
                <li>To authenticate your account and maintain your session</li>
                <li>To store your analysis history so you can revisit past results</li>
                <li>To enforce rate limits and prevent abuse</li>
                <li>To improve the Service (using aggregated, non-personal data)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                4. AI Processing
              </h2>
              <p>
                Your resume text and job descriptions are sent to our AI provider (NVIDIA, via their API) solely to generate your analysis results. This data is processed in transit and is not retained by the AI provider beyond what is needed to complete the request. We do not control NVIDIA's data retention policies — refer to NVIDIA's privacy policy for details on their processing.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                5. Data Storage and Retention
              </h2>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong className="text-gray-900 dark:text-[#f7f2ed]">Account data</strong> — stored in Supabase (PostgreSQL database) as long as your account exists</li>
                <li><strong className="text-gray-900 dark:text-[#f7f2ed]">Analysis history</strong> — stored in memory on our server; lost on server restart</li>
                <li><strong className="text-gray-900 dark:text-[#f7f2ed]">Uploaded files</strong> — processed in memory during the request and not permanently stored</li>
                <li><strong className="text-gray-900 dark:text-[#f7f2ed]">AI results</strong> — cached temporarily to avoid redundant API calls; cache clears periodically</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                6. Third-Party Services
              </h2>
              <p className="mb-2">We use the following third-party services:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong className="text-gray-900 dark:text-[#f7f2ed]">Supabase</strong> — authentication and database hosting</li>
                <li><strong className="text-gray-900 dark:text-[#f7f2ed]">NVIDIA AI</strong> — AI model inference for resume analysis and content generation</li>
                <li><strong className="text-gray-900 dark:text-[#f7f2ed]">Render</strong> — backend hosting</li>
                <li><strong className="text-gray-900 dark:text-[#f7f2ed]">Vercel</strong> — frontend hosting</li>
              </ul>
              <p className="mt-3">
                We do not use Google Analytics, advertising trackers, or any analytics services that track you across websites.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                7. Local Storage
              </h2>
              <p>
                We use your browser's local storage for:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Authentication session tokens (managed by Supabase)</li>
                <li>Theme preference (dark/light mode)</li>
              </ul>
              <p className="mt-3">
                No tracking cookies, advertising identifiers, or third-party cookies are set by our application.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                8. Data Sharing
              </h2>
              <p>
                We do not sell, rent, or share your personal information with third parties except:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>With AI providers solely to process your analysis requests (as described in section 4)</li>
                <li>When required by law or to protect our rights</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                9. Data Security
              </h2>
              <p>
                We implement industry-standard security measures including encrypted connections (HTTPS/TLS), JWT-based authentication, and rate limiting. However, no method of electronic transmission is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                10. Your Rights
              </h2>
              <p className="mb-2">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Access the personal data we hold about you</li>
                <li>Request deletion of your account and data (via Profile → Account Settings → Delete Account, or by emailing us)</li>
                <li>Export your analysis history</li>
                <li>Withdraw consent for data processing at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                11. Children's Privacy
              </h2>
              <p>
                Our Service is not intended for children under 13. We do not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                12. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page with a new "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                13. Contact
              </h2>
              <p>
                Questions about this Privacy Policy? Contact us at{' '}
                <a href="mailto:privacy@guidely.app" className="text-[#f575ad] hover:underline">
                  privacy@guidely.app
                </a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

export default PrivacyPolicy;
