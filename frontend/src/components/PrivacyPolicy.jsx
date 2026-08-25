import { SEO } from './SEO';

/**
 * Privacy Policy Page
 */
export function PrivacyPolicy() {
  return (
    <>
      <SEO 
        title="Privacy Policy"
        description="Guidely's privacy policy. Learn how we collect, use, and protect your personal information."
        canonical="https://guidely.app/privacy"
        noIndex={true}
      />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Privacy Policy
          </h1>
          
          <div className="prose prose-lg max-w-none text-gray-600 dark:text-gray-300">
            <p className="text-sm text-gray-500 mb-8">
              Last updated: August 25, 2026
            </p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Introduction
              </h2>
              <p>
                Welcome Guidely ("we," "our," or "us"). We are committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you use our website and services.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                2. Information We Collect
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Personal Information
              </h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Email address (for account creation)</li>
                <li>Resume content (for analysis)</li>
                <li>Job descriptions (for analysis)</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Usage Data
              </h3>
              <ul className="list-disc pl-6">
                <li>Browser type and version</li>
                <li>Pages visited</li>
                <li>Time spent on pages</li>
                <li>Referring website</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                3. How We Use Your Information
              </h2>
              <p className="mb-4">We use your information to:</p>
              <ul className="list-disc pl-6">
                <li>Provide and maintain our service</li>
                <li>Analyze resumes and job descriptions</li>
                <li>Improve our AI algorithms</li>
                <li>Send you service-related communications</li>
                <li>Respond to your inquiries</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                4. Data Security
              </h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal 
                information, including encryption in transit (TLS) and at rest. However, no method of 
                transmission over the Internet is 100% secure.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Data Retention
              </h2>
              <p>
                We retain your personal information only for as long as necessary to provide you with 
                our services. You may request deletion of your data at any time through your account 
                settings or by contacting us.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Third-Party Services
              </h2>
              <p className="mb-4">We use the following third-party services:</p>
              <ul className="list-disc pl-6">
                <li>Supabase (authentication and database)</li>
                <li>NVIDIA AI (resume analysis)</li>
                <li>Google Analytics (usage analytics)</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                7. Your Rights
              </h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc pl-6">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Data portability</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                8. Cookies
              </h2>
              <p>
                We use essential cookies to maintain your session. We do not use tracking cookies 
                without your consent. You can control cookie settings in your browser.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                9. Children's Privacy
              </h2>
              <p>
                Our service is not intended for children under 13. We do not knowingly collect 
                personal information from children under 13.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                10. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any 
                changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                11. Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="mt-2">
                <strong>Email:</strong> privacy@guidely.app
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

export default PrivacyPolicy;
