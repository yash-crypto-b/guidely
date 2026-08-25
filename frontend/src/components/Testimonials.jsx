/**
 * Testimonials Section - Customer Reviews with Schema Markup
 */
export function Testimonials() {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer at Google",
      initials: "SC",
      color: "bg-blue-500",
      content: "Guidely helped me identify key skills I was missing from my resume. After optimizing it, I got callbacks from 3 FAANG companies in one week!",
      rating: 5,
    },
    {
      name: "Michael Rodriguez",
      role: "Product Manager at Microsoft",
      initials: "MR",
      color: "bg-green-500",
      content: "The ATS score breakdown was incredibly insightful. I finally understood why my resume wasn't getting past the initial screening.",
      rating: 5,
    },
    {
      name: "Emily Thompson",
      role: "UX Designer at Airbnb",
      initials: "ET",
      color: "bg-purple-500",
      content: "The custom CV generator saved me hours of formatting. The LaTeX output was professional and perfectly optimized for ATS systems.",
      rating: 5,
    },
    {
      name: "David Kim",
      role: "Data Scientist at Netflix",
      initials: "DK",
      color: "bg-red-500",
      content: "I was skeptical at first, but the interview questions were spot-on. They helped me prepare for questions I actually got asked!",
      rating: 5,
    },
    {
      name: "Jessica Patel",
      role: "Marketing Manager at Spotify",
      initials: "JP",
      color: "bg-yellow-500",
      content: "The cover letter generator is a game-changer. It creates personalized letters that actually highlight my relevant experience.",
      rating: 5,
    },
    {
      name: "Alex Johnson",
      role: "Full Stack Developer at Stripe",
      initials: "AJ",
      color: "bg-indigo-500",
      content: "From a 45% to a 92% ATS score - Guidely showed me exactly what to fix. Landed my dream job within a month!",
      rating: 5,
    },
  ];

  // Schema.org Review structured data
  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Guidely",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "1250",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": testimonials.map(t => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": t.name
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": t.rating,
        "bestRating": 5
      },
      "reviewBody": t.content
    }))
  };

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <script type="application/ld+json">
        {JSON.stringify(reviewSchema)}
      </script>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Loved by Job Seekers Worldwide
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join thousands of professionals who landed their dream jobs with Guidely
          </p>
          
          {/* Trust Rating */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className="h-6 w-6 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              4.8/5 from 1,250+ reviews
            </span>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
              itemScope
              itemType="https://schema.org/Review"
            >
              {/* Rating */}
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="h-5 w-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    itemProp="reviewRating"
                    itemScope
                    itemType="https://schema.org/Rating"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              
              {/* Content */}
              <p className="text-gray-600 dark:text-gray-300 mb-6" itemProp="reviewBody">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              
              {/* Author */}
              <div className="flex items-center" itemProp="author" itemScope itemType="https://schema.org/Person">
                {/* Avatar with initials instead of image */}
                <div className={`w-12 h-12 rounded-full ${testimonial.color} flex items-center justify-center text-white font-semibold mr-4`}>
                  {testimonial.initials}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white" itemProp="name">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
