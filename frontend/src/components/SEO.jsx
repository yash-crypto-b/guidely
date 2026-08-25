import { useEffect } from 'react';

/**
 * SEO Component - Manages meta tags for each page
 */
export function SEO({ 
  title, 
  description, 
  keywords, 
  canonical, 
  ogImage,
  noIndex = false 
}) {
  const siteName = 'Guidely';
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} - AI-Powered ATS Resume Analyzer`;
  const defaultDescription = 'Get your ATS match score instantly. Our AI analyzes your resume against job descriptions, provides a custom CV, and generates interview questions.';
  const finalDescription = description || defaultDescription;

  useEffect(() => {
    // Update title
    document.title = fullTitle;
    
    // Update meta tags
    const updateMeta = (name, content) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    const updateProperty = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateMeta('description', finalDescription);
    if (keywords) updateMeta('keywords', keywords);
    if (noIndex) updateMeta('robots', 'noindex, nofollow');
    
    // Open Graph
    updateProperty('og:title', fullTitle);
    updateProperty('og:description', finalDescription);
    if (ogImage) updateProperty('og:image', ogImage);
    
    // Twitter
    updateProperty('twitter:title', fullTitle);
    updateProperty('twitter:description', finalDescription);
    
    // Canonical
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
    }
  }, [fullTitle, finalDescription, keywords, canonical, ogImage, noIndex]);

  return null;
}

export default SEO;
