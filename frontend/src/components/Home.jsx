import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AnalysisForm } from '@/components/AnalysisForm';
import { AnalysisResults } from '@/components/AnalysisResults';
import { useTheme } from '@/lib/ThemeContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://guidely-backend.onrender.com';

export function Home({ user }) {
  const [result, setResult] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvError, setCvError] = useState('');
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [coverLetterError, setCoverLetterError] = useState('');
  const { dark, toggleTheme } = useTheme();

  function handleResult(data) {
    setResult(data);
    setCvLoading(!data.custom_cv);
    setCvError('');
    setCoverLetterLoading(!data.cover_letter);
    setCoverLetterError('');

    // Use parsedResumeText (actual text from PDF) instead of _meta.resumeText (which might be [PDF_UPLOADED])
    const resumeForGeneration = data.parsedResumeText || data._meta?.resumeText || '';
    const jdForGeneration = data._meta?.jobDescription || '';

    if (!data.custom_cv && jdForGeneration && resumeForGeneration) {
      fetchCustomCV({ jobDescription: jdForGeneration, resumeText: resumeForGeneration }, data.rationale);
    }
    if (!data.cover_letter && jdForGeneration && resumeForGeneration) {
      fetchCoverLetter({ jobDescription: jdForGeneration, resumeText: resumeForGeneration }, data.rationale);
    }
  }

  async function fetchCustomCV(meta, rationale) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/analyze/cv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobDescription: meta.jobDescription,
          resumeText: meta.resumeText,
          rationale,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);

      setResult(prev => ({ ...prev, custom_cv: data.custom_cv }));
    } catch (err) {
      console.error('CV generation error:', err);
      setCvError('Unable to generate optimized resume. Please try again later.');
    } finally {
      setCvLoading(false);
    }
  }

  async function fetchCoverLetter(meta, rationale) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/analyze/cover-letter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobDescription: meta.jobDescription,
          resumeText: meta.resumeText,
          rationale,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);

      setResult(prev => ({ ...prev, cover_letter: data.cover_letter }));
    } catch (err) {
      console.error('Cover letter generation error:', err);
      setCoverLetterError('Unable to generate cover letter. Please try again later.');
    } finally {
      setCoverLetterLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold text-[#5B5FC7]">Guidely</span>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-sm font-medium text-[#5B5FC7] border-b-2 border-[#5B5FC7] pb-0.5">Dashboard</a>
              <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">History</a>
              <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">Resources</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {/* Theme toggle button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>
            <div className="h-5 w-px bg-gray-200 dark:bg-gray-600" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{user.email}</span>
            <button onClick={() => supabase.auth.signOut()} className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium">Sign out</button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {result ? (
          <div className="max-w-4xl mx-auto px-6 py-10">
            <AnalysisResults 
              result={result} 
              onReset={() => setResult(null)} 
              cvLoading={cvLoading} 
              cvError={cvError}
              coverLetterLoading={coverLetterLoading}
              coverLetterError={coverLetterError}
            />
          </div>
        ) : (
          <>
            <div className="text-center py-12">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Precision ATS Analysis</h1>
              <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                Paste your job description and resume to get an instant match score and actionable feedback.
              </p>
            </div>
            <div className="max-w-3xl mx-auto px-6 pb-16">
              <AnalysisForm user={user} onResult={handleResult} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
