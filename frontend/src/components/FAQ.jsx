import { useState } from 'react';

/**
 * FAQ Section - Frequently Asked Questions with Schema Markup
 */
export function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "What is an ATS score?",
      answer: "An ATS (Applicant Tracking System) score measures how well your resume matches a specific job description. Many companies use ATS software to filter resumes before a human reviews them. A higher score means your resume is more likely to pass through these automated filters and reach a hiring manager."
    },
    {
      question: "How does Guidely analyze my resume?",
      answer: "Guidely uses advanced AI to analyze your resume against job descriptions. We check for skills match, experience relevance, keyword optimization, and education fit. Our algorithm calculates a weighted score based on these factors and provides actionable recommendations."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, absolutely. We take data privacy seriously. Your resume and job descriptions are encrypted in transit and at rest. We never share your personal information with third parties. You can delete your data at any time from your account settings."
    },
    {
      question: "How accurate is the ATS score?",
      answer: "Our AI model is trained on thousands of successful resumes and job descriptions. While no ATS simulator can perfectly replicate every company's system, our scores correlate highly with actual ATS pass rates. Users report a 3x increase in interview callbacks after optimizing their resumes with Guidely."
    },
    {
      question: "Can I analyze multiple resumes?",
      answer: "Yes! You can analyze multiple resumes and job descriptions. Our free tier allows several analyses per month, and our Pro plan offers unlimited analyses. You can also save and compare different versions of your resume."
    },
    {
      question: "What file formats are supported?",
      answer: "We support PDF and plain text files for resume uploads. You can also paste your resume text directly. For best results, we recommend using text-based PDFs (not scanned images)."
    },
    {
      question: "How does the custom CV generation work?",
      answer: "After analyzing your resume and the job description, our AI generates a professionally formatted LaTeX resume optimized for ATS systems. You can download it as a .tex file, compile it to PDF, or open it directly in Overleaf for further editing."
    },
    {
      question: "What are the interview questions based on?",
      answer: "Our AI generates interview questions based on the gaps between your resume and the job requirements. These are tailored to the specific role and help you prepare for questions you're likely to face in the interview."
    },
    {
      question: "Is Guidely free to use?",
      answer: "Yes, Guidely offers a free tier that includes ATS score analysis, interview questions, and basic features. For unlimited analyses, custom CV generation, and cover letters, check out our Pro plan."
    },
    {
      question: "Can I use Guidely on mobile?",
      answer: "Yes! Guidely is fully responsive and works great on mobile devices. You can analyze resumes, view scores, and download documents from your phone or tablet."
    }
  ];

  // Schema.org FAQ structured data
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <section className="py-20 bg-white dark:bg-gray-800" itemScope itemType="https://schema.org/FAQPage">
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-12">
          Everything you need to know about Guidely and ATS scoring
        </p>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
              itemScope 
              itemProp="mainEntity" 
              itemType="https://schema.org/Question"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between bg-gray-50 dark:bg-gray-750 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-white" itemProp="name">
                  {faq.question}
                </span>
                <svg
                  className={`h-5 w-5 text-gray-500 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {openIndex === index && (
                <div 
                  className="px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
                  itemScope 
                  itemProp="acceptedAnswer" 
                  itemType="https://schema.org/Answer"
                >
                  <p className="text-gray-600 dark:text-gray-300" itemProp="text">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;
