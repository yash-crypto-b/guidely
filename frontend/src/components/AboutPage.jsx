import { SEO } from './SEO';
import { TrustSignals } from './TrustSignals';

/**
 * About Page - Company information and mission
 */
export function AboutPage() {
  return (
    <>
      <SEO 
        title="About Us - Our Mission to Help You Get Hired"
        description="Learn about Guidely's mission to help job seekers land their dream jobs through AI-powered resume analysis and optimization."
        canonical="https://guidely.app/about"
        keywords="about guidely, resume analysis company, AI career tools"
      />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <section className="py-20 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Our Mission: <span className="text-[#5B5FC7]">Everyone Deserves Their Dream Job</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                We believe that getting hired shouldn't depend on who you know or how well you can 
                game the system. It should be about your skills, experience, and potential.
              </p>
            </div>
          </div>
        </section>
        
        {/* Story Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Our Story
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Guidely was born from a simple frustration: qualified candidates were being rejected 
                  by automated systems before a human ever saw their resume.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Our founder experienced this firsthand after being rejected from a role they were 
                  perfectly qualified for. The reason? Their resume wasn't optimized for the ATS.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  We built Guidely to level the playing field. Now, anyone can understand exactly how 
                  their resume performs against ATS systems and get actionable feedback to improve it.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#5B5FC7] to-[#7C7FFF] rounded-2xl p-8 text-white">
                <div className="text-center">
                  <div className="text-6xl font-bold mb-2">10K+</div>
                  <div className="text-xl opacity-90">Resumes Analyzed</div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold">85%</div>
                    <div className="text-sm opacity-80">More Interviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">4.8/5</div>
                    <div className="text-sm opacity-80">User Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Values Section */}
        <section className="py-20 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              Our Values
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <ValueCard 
                title="Transparency"
                description="We show you exactly how ATS systems work and what you can do to optimize your resume."
                icon={
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              />
              <ValueCard 
                title="Privacy First"
                description="Your resume is your data. We never sell it, share it, or use it for anything other than analysis."
                icon={
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />
              <ValueCard 
                title="Continuous Improvement"
                description="Our AI gets better with every analysis. We're constantly improving our algorithms."
                icon={
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                }
              />
            </div>
          </div>
        </section>
        
        {/* Trust Signals */}
        <TrustSignals />
        
        {/* Team Section */}
        <section className="py-20 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              Our Team
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <TeamMember 
                name="Alex Johnson"
                role="Founder & CEO"
                initials="AJ"
                color="bg-[#5B5FC7]"
                bio="Former software engineer who experienced ATS rejection firsthand."
              />
              <TeamMember 
                name="Sarah Chen"
                role="Head of AI"
                initials="SC"
                color="bg-green-500"
                bio="Machine learning expert with 10+ years in NLP and document analysis."
              />
              <TeamMember 
                name="Michael Rodriguez"
                role="Head of Product"
                initials="MR"
                color="bg-blue-500"
                bio="Product leader passionate about building tools that help people succeed."
              />
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 bg-[#5B5FC7]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Job Search?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of job seekers who landed their dream jobs with Guidely.
            </p>
            <a
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-[#5B5FC7] bg-white rounded-xl hover:bg-gray-100 transition-all shadow-lg"
            >
              Get Started Free
            </a>
          </div>
        </section>
      </div>
    </>
  );
}

// Sub-components
function ValueCard({ title, description, icon }) {
  return (
    <div className="text-center p-6">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#5B5FC7]/10 text-[#5B5FC7] mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

function TeamMember({ name, role, initials, color, bio }) {
  return (
    <div className="text-center">
      {/* Avatar with initials instead of image */}
      <div className={`w-32 h-32 rounded-full ${color} flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4`}>
        {initials}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{name}</h3>
      <p className="text-[#5B5FC7] font-medium mb-2">{role}</p>
      <p className="text-gray-600 dark:text-gray-400">{bio}</p>
    </div>
  );
}

export default AboutPage;
