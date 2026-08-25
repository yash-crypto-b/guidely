/**
 * Trust Signals Component - Builds credibility and trust
 */
export function TrustSignals() {
  const stats = [
    { number: "10,000+", label: "Resumes Analyzed" },
    { number: "4.8/5", label: "Average Rating" },
    { number: "85%", label: "Interview Rate Increase" },
    { number: "50+", label: "Countries Served" },
  ];

  const certifications = [
    { name: "SOC 2 Certified", icon: "🛡️" },
    { name: "GDPR Compliant", icon: "🇪🇺" },
    { name: "SSL Encrypted", icon: "🔒" },
    { name: "PCI DSS", icon: "💳" },
  ];

  const partners = [
    "Google", "Microsoft", "Amazon", "Apple", "Meta"
  ];

  return (
    <section className="py-12 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-[#5B5FC7] mb-1">{stat.number}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
        
        {/* Certifications */}
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          {certifications.map((cert, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-750 rounded-lg"
            >
              <span className="text-xl">{cert.icon}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cert.name}</span>
            </div>
          ))}
        </div>
        
        {/* As Featured In */}
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Trusted by professionals from
          </p>
          <div className="flex flex-wrap justify-center gap-8 opacity-50">
            {partners.map((partner, index) => (
              <div 
                key={index}
                className="text-xl font-bold text-gray-400 dark:text-gray-500"
              >
                {partner}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TrustSignals;
