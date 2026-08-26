import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ResumeComparison } from '@/components/ResumeComparison';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const recommendationConfig = {
  apply: { label: 'Strong Match', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-700' },
  tailor: { label: 'Needs Tailoring', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-700' },
  skip: { label: 'Poor Match', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-700' },
};

function ScoreCircle({ score }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" className="dark:stroke-gray-600" strokeWidth="8" />
        <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-gray-900 dark:text-white">{score}</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, score }) {
  const color = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-white">{score}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function LoadingSkeleton({ type }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className="h-8 w-8 rounded-lg bg-[#5B5FC7]/10 flex items-center justify-center">
          <svg className="h-4 w-4 text-[#5B5FC7] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={type === 'cv' ? "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" : "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"} />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{type === 'cv' ? 'Optimized CV' : 'Cover Letter'}</h3>
        <span className="ml-auto text-xs text-[#5B5FC7] animate-pulse">Generating...</span>
      </div>
      <div className="p-5 space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" style={{ width: `${100 - i * 10}%` }} />
        ))}
      </div>
    </div>
  );
}

function Toast({ message, type, onClose }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
      type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {type === 'success' ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">×</button>
    </div>
  );
}

export function AnalysisResults({ result, onReset, cvLoading, cvError, coverLetterLoading, coverLetterError }) {
  const { ats_score, score_breakdown, recommendation, rationale, custom_cv, cover_letter, interview_questions, _meta } = result;
  const originalResume = _meta?.resumeText || '';
  const [copied, setCopied] = useState(false);
  const [copiedCoverLetter, setCopiedCoverLetter] = useState(false);
  const [toast, setToast] = useState(null);
  const rec = recommendationConfig[recommendation] || recommendationConfig.skip;

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(custom_cv);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = custom_cv;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    showToast('LaTeX code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }

  async function copyCoverLetter() {
    try {
      await navigator.clipboard.writeText(cover_letter);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = cover_letter;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedCoverLetter(true);
    showToast('Cover letter copied to clipboard!');
    setTimeout(() => setCopiedCoverLetter(false), 2000);
  }

  function downloadCoverLetter() {
    const blob = new Blob([cover_letter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cover-letter.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded cover-letter.txt');
  }

  function openInOverleaf() {
    navigator.clipboard.writeText(custom_cv).then(() => {
      showToast('LaTeX copied! Paste it in Overleaf (Ctrl+V)');
      window.open('https://www.overleaf.com/project', '_blank');
    }).catch(() => {
      window.open('https://www.overleaf.com/project', '_blank');
    });
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analysis Complete</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center">
          <span className="text-xs font-semibold tracking-wider text-gray-400 dark:text-gray-500 uppercase mb-4">Match Score</span>
          <div className="relative">
            <ScoreCircle score={ats_score} />
          </div>
          <span className={`mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${rec.bg} ${rec.color} ${rec.border} border`}>
            {rec.label}
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <span className="text-xs font-semibold tracking-wider text-gray-400 dark:text-gray-500 uppercase mb-5 block">Score Breakdown</span>
          <div className="space-y-4">
            <ScoreBar label="Skills" score={score_breakdown.skills_match} />
            <ScoreBar label="Experience" score={score_breakdown.experience_match} />
            <ScoreBar label="Keywords" score={score_breakdown.keyword_match} />
            <ScoreBar label="Education" score={score_breakdown.education_match} />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-lg bg-[#5B5FC7]/10 flex items-center justify-center">
            <svg className="h-4 w-4 text-[#5B5FC7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Analysis</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{rationale}</p>
      </div>

      {/* Resume Comparison Section */}
      {originalResume && custom_cv && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-[#5B5FC7]/10 flex items-center justify-center">
              <svg className="h-4 w-4 text-[#5B5FC7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Resume Comparison</h3>
          </div>
          <ResumeComparison 
            originalResume={originalResume} 
            optimizedResume={custom_cv}
            customCvLatex={custom_cv}
          />
        </div>
      )}

      {/* CV Section */}
      {cvLoading ? (
        <LoadingSkeleton type="cv" />
      ) : cvError ? (
        <div className="bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-xl p-6">
          <p className="text-sm text-amber-600 dark:text-amber-400">{cvError}</p>
        </div>
      ) : custom_cv ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-[#5B5FC7]/10 flex items-center justify-center">
                <svg className="h-4 w-4 text-[#5B5FC7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Optimized Resume</h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#5B5FC7] bg-[#5B5FC7]/10 rounded-lg hover:bg-[#5B5FC7]/20 transition-colors"
              >
                {copied ? (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy LaTeX
                  </>
                )}
              </button>

              <button
                onClick={openInOverleaf}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open in Overleaf
              </button>
            </div>

          </div>

          <div className="p-5 bg-[#1e1e2e]">
            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
              <code>{custom_cv}</code>
            </pre>
          </div>

          <p className="px-6 py-3 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700">
            Click "Open in Overleaf" to paste and compile online, or download the .tex file to compile locally.
          </p>
        </div>
      ) : null}

      {/* Cover Letter Section */}
      {coverLetterLoading ? (
        <LoadingSkeleton type="cover-letter" />
      ) : coverLetterError ? (
        <div className="bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-xl p-6">
          <p className="text-sm text-amber-600 dark:text-amber-400">{coverLetterError}</p>
        </div>
      ) : cover_letter ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-[#5B5FC7]/10 flex items-center justify-center">
                <svg className="h-4 w-4 text-[#5B5FC7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Cover Letter</h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={copyCoverLetter}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#5B5FC7] bg-[#5B5FC7]/10 rounded-lg hover:bg-[#5B5FC7]/20 transition-colors"
              >
                {copiedCoverLetter ? (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy
                  </>
                )}
              </button>

              <button
                onClick={downloadCoverLetter}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download .txt
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="prose prose-sm max-w-none text-gray-600 dark:text-gray-300">
              {cover_letter.split('\n\n').map((paragraph, i) => (
                <p key={i} className="mb-4 last:mb-0 leading-relaxed">{paragraph}</p>
              ))}
            </div>
          </div>

          <p className="px-6 py-3 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700">
            Customize this cover letter before sending. Personalize it with specific details about the company and role.
          </p>
        </div>
      ) : null}

      {/* Interview Questions Section */}
      {interview_questions && interview_questions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-8 w-8 rounded-lg bg-[#5B5FC7]/10 flex items-center justify-center">
              <svg className="h-4 w-4 text-[#5B5FC7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Predicted Interview Questions</h3>
          </div>
          <ol className="space-y-3">
            {interview_questions.map((q, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#5B5FC7]/10 text-xs font-semibold text-[#5B5FC7]">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed pt-0.5">{q}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="text-center pt-4">
        <button
          onClick={onReset}
          className="px-6 py-2.5 text-sm font-semibold text-[#5B5FC7] border border-[#5B5FC7] rounded-lg hover:bg-[#5B5FC7]/5 transition-colors"
        >
          Analyze Another Job
        </button>
      </div>
    </div>
  );
}
