import { useParams } from 'react-router-dom';
import { SEO } from './SEO';
import { Link } from 'react-router-dom';

/**
 * Services Page - Detail pages for each service
 */
export function ServicesPage() {
  const { service } = useParams();
  
  const services = {
    'ats-score': {
      title: 'ATS Score Analysis',
      h1: 'Get Your ATS Score in Seconds',
      description: 'Our AI analyzes your resume against job descriptions and gives you a detailed ATS match score with actionable feedback.',
      features: [
        'Instant score calculation',
        'Skills match breakdown',
        'Experience relevance analysis',
        'Keyword optimization tips',
        'Education fit assessment',
      ],
      cta: 'Get Your Free Score',
    },
    'resume-builder': {
      title: 'AI Resume Builder',
      h1: 'Build an ATS-Optimized Resume',
      description: 'Generate a professionally formatted resume tailored to your target job. Download as PDF or edit in LaTeX.',
      features: [
        'AI-generated content',
        'LaTeX formatting',
        'ATS-optimized structure',
        'Custom sections',
        'Multiple templates',
      ],
      cta: 'Build Your Resume',
    },
    'cover-letter': {
      title: 'Cover Letter Generator',
      h1: 'Create Personalized Cover Letters',
      description: 'Generate tailored cover letters that highlight your relevant experience for each job application.',
      features: [
        'Personalized content',
        'Job-specific highlights',
        'Professional tone',
        'Multiple formats',
        'Instant generation',
      ],
      cta: 'Generate Cover Letter',
    },
    'interview-prep': {
      title: 'Interview Preparation',
      h1: 'Ace Your Next Interview',
      description: 'Get 10 AI-generated interview questions based on your resume and the job requirements.',
      features: [
        'Tailored questions',
        'Gap analysis',
        'Common questions',
        'Technical questions',
        'Behavioral questions',
      ],
      cta: 'Prepare Now',
    },
  };

  // Default to main services page if no specific service
  if (!service || !services[service]) {
    return <ServicesOverview />;
  }

  const currentService = services[service];

  return (
    <>
      <SEO 
        title={currentService.title}
        description={currentService.description}
        canonical={`https://guidely.app/services/${service}`}
        keywords={`${currentService.title}, resume analysis, ATS score, job search tools`}
      />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <section className="py-20 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              {/* Clear H1 */}
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                {currentService.h1}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                {currentService.description}
              </p>
              
              {/* Strong CTA */}
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-[#5B5FC7] rounded-xl hover:bg-[#4A4EB5] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {currentService.cta}
                <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              What You Get
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentService.features.map((feature, index) => (
                <div 
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{feature}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* How It Works */}
        <section className="py-20 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Step 
                number="1"
                title="Sign Up"
                description="Create your free account in seconds. No credit card required."
              />
              <Step 
                number="2"
                title="Upload & Analyze"
                description="Upload your resume and paste the job description."
              />
              <Step 
                number="3"
                title="Get Results"
                description="Receive your score, custom CV, and interview questions instantly."
              />
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 bg-[#5B5FC7]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of job seekers who landed their dream jobs.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-[#5B5FC7] bg-white rounded-xl hover:bg-gray-100 transition-all shadow-lg"
            >
              Start Free Analysis
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

// Services Overview (when no specific service is selected)
function ServicesOverview() {
  const services = [
    {
      slug: 'ats-score',
      title: 'ATS Score Analysis',
      description: 'Get an instant score showing how well your resume matches job descriptions.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      slug: 'resume-builder',
      title: 'AI Resume Builder',
      description: 'Generate a professionally formatted resume optimized for ATS systems.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      slug: 'cover-letter',
      title: 'Cover Letter Generator',
      description: 'Create personalized cover letters tailored to each job application.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      slug: 'interview-prep',
      title: 'Interview Preparation',
      description: 'Get AI-generated interview questions based on your resume and the job.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <SEO 
        title="Our Services - AI-Powered Career Tools"
        description="Explore our suite of AI-powered tools to optimize your resume, prepare for interviews, and land your dream job."
        canonical="https://guidely.app/services"
        keywords="resume analysis, ATS score, interview preparation, cover letter generator, career tools"
      />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <section className="py-20 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              AI-Powered Career Tools
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Everything you need to optimize your resume, prepare for interviews, and land your dream job.
            </p>
          </div>
        </section>
        
        {/* Services Grid */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8">
              {services.map((svc) => (
                <Link
                  key={svc.slug}
                  to={`/services/${svc.slug}`}
                  className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all hover:border-[#5B5FC7]/50"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-[#5B5FC7]/10 text-[#5B5FC7] mb-4">
                    {svc.icon}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{svc.title}</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{svc.description}</p>
                  <span className="text-[#5B5FC7] font-semibold flex items-center gap-2">
                    Learn More
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              ))}
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
              Start using Guidely today and land your dream job faster.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-[#5B5FC7] bg-white rounded-xl hover:bg-gray-100 transition-all shadow-lg"
            >
              Get Started Free
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

// Step component
function Step({ number, title, description }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#5B5FC7] text-white font-bold text-xl mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

export default ServicesPage;
