import { Link } from 'react-router-dom';
import { SEO } from './SEO';

export function TermsOfService() {
  return (
    <>
      <SEO
        title="Terms of Service — Guidely"
        description="Guidely's terms of service. Read about the rules and guidelines for using our platform."
        canonical="https://guidely.app/terms"
        noIndex={true}
      />

      <div className="min-h-screen bg-gray-50 dark:bg-[#080a12] text-gray-900 dark:text-[#f7f2ed]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <Link to="/" className="text-sm text-[#f575ad] hover:underline mb-8 inline-block">
            ← Back to home
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-sm text-gray-500 dark:text-[#6b6e78] mb-10">
            Last updated: August 28, 2026
          </p>

          <div className="space-y-10 text-[15px] leading-relaxed text-gray-600 dark:text-[#b8b5bd]">
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using Guidely ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                2. Description of Service
              </h2>
              <p>
                Guidely provides AI-powered resume analysis and optimization tools. The Service allows you to submit a resume and job description to receive an ATS match score, a recommendation, a tailored resume, and interview preparation questions.
              </p>
              <p className="mt-3">
                <strong className="text-gray-900 dark:text-[#f7f2ed]">Important:</strong> ATS scores are informational estimates based on AI analysis. They are not guarantees of how any specific ATS or employer will evaluate your resume.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                3. Account Registration
              </h2>
              <p>
                You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials. You must notify us immediately of any unauthorized use of your account.
              </p>
              <p className="mt-3">
                You must be at least 13 years old to use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                4. Your Content
              </h2>
              <p>
                You retain ownership of any resume text, job descriptions, or other content you submit to the Service ("Your Content"). By submitting Your Content, you grant Guidely a limited license to process it solely for the purpose of providing the Service to you.
              </p>
              <p className="mt-3">
                Your Content is processed by our AI provider (NVIDIA) to generate analysis results. We do not sell your content to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                5. Acceptable Use
              </h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Use the Service for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Interfere with or disrupt the Service or its infrastructure</li>
                <li>Use automated tools to access the Service in ways that exceed reasonable usage</li>
                <li>Submit content that is fraudulent, misleading, or harmful</li>
                <li>Resell or redistribute the Service without written permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                6. AI-Generated Content
              </h2>
              <p>
                The Service uses artificial intelligence to generate tailored resumes, cover letters, and interview questions. AI-generated content is based on Your Content and the job description you provide. You are responsible for reviewing and verifying all AI-generated content before using it in job applications.
              </p>
              <p className="mt-3">
                AI-generated resumes reorganize and rephrase your actual experience. They do not fabricate employers, titles, or credentials. However, you should verify that the output accurately represents your background.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                7. Service Availability
              </h2>
              <p>
                We strive to keep the Service available but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or factors beyond our control. We are not liable for any downtime or data loss.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                8. Limitation of Liability
              </h2>
              <p>
                The Service is provided "as is" without warranties of any kind. To the maximum extent permitted by law, Guidely shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
              </p>
              <p className="mt-3">
                We do not guarantee that using the Service will result in interviews, job offers, or any specific employment outcome.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                9. Account Termination
              </h2>
              <p>
                You may delete your account at any time from your profile settings. We may suspend or terminate your account if you violate these Terms. Upon termination, your data will be handled in accordance with our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                10. Changes to These Terms
              </h2>
              <p>
                We may update these Terms from time to time. We will notify you of material changes by posting the updated Terms on this page and updating the "Last updated" date. Continued use of the Service after changes constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#f7f2ed] mb-3">
                11. Contact
              </h2>
              <p>
                Questions about these Terms? Contact us at{' '}
                <a href="mailto:support@guidely.app" className="text-[#f575ad] hover:underline">
                  support@guidely.app
                </a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

export default TermsOfService;
