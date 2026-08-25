import { useState } from 'react';

function HighlightDiff({ original, optimized }) {
  // Simple word-level diff highlighting
  const originalWords = (original || '').split(/\s+/);
  const optimizedWords = (optimized || '').split(/\s+/);
  
  // Find common words
  const commonWords = new Set(originalWords.filter(w => optimizedWords.includes(w)));
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Original */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
              <svg className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Original Resume</h4>
          </div>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto">
          <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans leading-relaxed">
            {original || 'No original resume text available'}
          </pre>
        </div>
      </div>
      
      {/* Optimized */}
      <div className="bg-white dark:bg-gray-800 border border-[#5B5FC7]/30 dark:border-[#5B5FC7]/50 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#5B5FC7]/20 dark:border-[#5B5FC7]/30 bg-[#5B5FC7]/5 dark:bg-[#5B5FC7]/10">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-[#5B5FC7]/20 flex items-center justify-center">
              <svg className="h-3 w-3 text-[#5B5FC7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-[#5B5FC7]">ATS-Optimized Version</h4>
            <span className="ml-auto text-xs text-[#5B5FC7]/70">LaTeX</span>
          </div>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto bg-[#1e1e2e]">
          <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
            {optimized || 'Generating optimized version...'}
          </pre>
        </div>
      </div>
    </div>
  );
}

function KeywordComparison({ original, optimized }) {
  // Extract keywords (simple approach)
  const extractKeywords = (text) => {
    const commonStopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now']);
    
    return (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !commonStopWords.has(w));
  };
  
  const originalKeywords = new Set(extractKeywords(original));
  const optimizedKeywords = new Set(extractKeywords(optimized));
  
  // Find new keywords added in optimized version
  const newKeywords = [...optimizedKeywords].filter(k => !originalKeywords.has(k));
  
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <svg className="h-4 w-4 text-[#5B5FC7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        Keyword Changes
      </h4>
      
      {newKeywords.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {newKeywords.length} new keywords added for ATS optimization:
          </p>
          <div className="flex flex-wrap gap-2">
            {newKeywords.slice(0, 20).map((keyword, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700"
              >
                + {keyword}
              </span>
            ))}
            {newKeywords.length > 20 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                +{newKeywords.length - 20} more
              </span>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          No significant keyword changes detected. The optimization focused on structure and formatting.
        </p>
      )}
    </div>
  );
}

export function ResumeComparison({ originalResume, optimizedResume, customCvLatex }) {
  const [activeTab, setActiveTab] = useState('side-by-side');
  
  // Parse the LaTeX to extract plain text content for comparison
  const extractPlainTextFromLatex = (latex) => {
    if (!latex) return '';
    return latex
      .replace(/\\documentclass\{[^}]*\}/g, '')
      .replace(/\\usepackage\{[^}]*\}/g, '')
      .replace(/\\begin\{document\}/g, '')
      .replace(/\\end\{document\}/g, '')
      .replace(/\\section\{([^}]*)\}/g, '\n--- $1 ---\n')
      .replace(/\\textbf\{([^}]*)\}/g, '$1')
      .replace(/\\textit\{([^}]*)\}/g, '$1')
      .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
      .replace(/\\[a-zA-Z]+/g, '')
      .replace(/[{}]/g, '')
      .replace(/\\\\/g, '\n')
      .replace(/\\\\%/g, '%')
      .replace(/\\\\&/g, '&')
      .replace(/\\\\#/g, '#')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };
  
  const optimizedPlainText = extractPlainTextFromLatex(customCvLatex || optimizedResume);
  
  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <button
          onClick={() => setActiveTab('side-by-side')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'side-by-side'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            Side by Side
          </span>
        </button>
        <button
          onClick={() => setActiveTab('keywords')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'keywords'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Keywords
          </span>
        </button>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'side-by-side' ? (
        <HighlightDiff original={originalResume} optimized={optimizedPlainText} />
      ) : (
        <KeywordComparison original={originalResume} optimized={optimizedPlainText} />
      )}
    </div>
  );
}
