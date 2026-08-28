import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AnalysisForm } from '@/components/AnalysisForm';
import { AnalysisResults } from '@/components/AnalysisResults';
import { getApiBase } from '@/lib/api';

const API_BASE = getApiBase();

export function Home({ user }) {
  const [result, setResult] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvError, setCvError] = useState('');
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [coverLetterError, setCoverLetterError] = useState('');


  function handleResult(data) {
    setResult(data);
    setCvLoading(!data.custom_cv);
    setCvError('');
    setCoverLetterLoading(!data.cover_letter);
    setCoverLetterError('');

    const resumeForGeneration = data.parsedResumeText || data._meta?.resumeText || '';
    const jdForGeneration = data._meta?.jobDescription || '';

    if (!data.custom_cv && jdForGeneration && resumeForGeneration) {
      fetchCustomCV({ jobDescription: jdForGeneration, resumeText: resumeForGeneration }, data.rationale);
    }
    if (!data.cover_letter && jdForGeneration && resumeForGeneration) {
      setTimeout(() => {
        fetchCoverLetter({ jobDescription: jdForGeneration, resumeText: resumeForGeneration }, data.rationale);
      }, 2000);
    }
  }

  function retryCV() {
    const resumeForGeneration = result?.parsedResumeText || result?._meta?.resumeText || '';
    const jdForGeneration = result?._meta?.jobDescription || '';
    if (!jdForGeneration || !resumeForGeneration) return;
    setCvError('');
    setCvLoading(true);
    fetchCustomCV({ jobDescription: jdForGeneration, resumeText: resumeForGeneration }, result?.rationale);
  }

  function retryCoverLetter() {
    const resumeForGeneration = result?.parsedResumeText || result?._meta?.resumeText || '';
    const jdForGeneration = result?._meta?.jobDescription || '';
    if (!jdForGeneration || !resumeForGeneration) return;
    setCoverLetterError('');
    setCoverLetterLoading(true);
    fetchCoverLetter({ jobDescription: jdForGeneration, resumeText: resumeForGeneration }, result?.rationale);
  }

  async function fetchWithTimeout(url, options, timeoutMs = 180_000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      return res;
    } finally {
      clearTimeout(timer);
    }
  }

  async function doFetchCV(meta, rationale, token) {
    const res = await fetchWithTimeout(`${API_BASE}/api/analyze/cv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ jobDescription: meta.jobDescription, resumeText: meta.resumeText, rationale }),
    }, 180_000);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
    return data;
  }

  async function doFetchCoverLetter(meta, rationale, token) {
    const res = await fetchWithTimeout(`${API_BASE}/api/analyze/cover-letter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ jobDescription: meta.jobDescription, resumeText: meta.resumeText, rationale }),
    }, 180_000);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
    return data;
  }

  async function fetchCustomCV(meta, rationale) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setCvError('Session expired. Please sign in again.'); return; }

      let lastErr;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const data = await doFetchCV(meta, rationale, token);
          setResult(prev => ({ ...prev, custom_cv: data.custom_cv }));
          return;
        } catch (err) {
          lastErr = err;
          console.error(`CV generation attempt ${attempt}/2 failed:`, err.message);
          if (attempt < 2) await new Promise(r => setTimeout(r, 3000));
        }
      }
      const msg = lastErr?.name === 'AbortError'
        ? 'CV generation timed out. The AI service may be overloaded — please try again.'
        : lastErr?.message || 'Unable to generate optimized resume. Please try again later.';
      setCvError(msg);
    } finally { setCvLoading(false); }
  }

  async function fetchCoverLetter(meta, rationale) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setCoverLetterError('Session expired. Please sign in again.'); return; }

      let lastErr;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const data = await doFetchCoverLetter(meta, rationale, token);
          setResult(prev => ({ ...prev, cover_letter: data.cover_letter }));
          return;
        } catch (err) {
          lastErr = err;
          console.error(`Cover letter attempt ${attempt}/2 failed:`, err.message);
          if (attempt < 2) await new Promise(r => setTimeout(r, 3000));
        }
      }
      const msg = lastErr?.name === 'AbortError'
        ? 'Cover letter timed out. The AI service may be overloaded — please try again.'
        : lastErr?.message || 'Unable to generate cover letter. Please try again later.';
      setCoverLetterError(msg);
    } finally { setCoverLetterLoading(false); }
  }

  return (
    <div>
      {result ? (
        <div className="max-w-4xl">
          <AnalysisResults result={result} onReset={() => setResult(null)} cvLoading={cvLoading} cvError={cvError} coverLetterLoading={coverLetterLoading} coverLetterError={coverLetterError} onRetryCV={retryCV} onRetryCoverLetter={retryCoverLetter} />
        </div>
      ) : (
        <>
          <div className="text-center pt-8 pb-6">
            <p className="mb-4 text-[13px] font-semibold uppercase tracking-[1.4px] text-[#f27db8]">ATS Analysis</p>
            <h1 className="text-[clamp(1.5rem,3vw,2.25rem)] font-extrabold tracking-[-0.04em] text-gray-900 dark:text-[#f7f2ed]">Precision match scoring</h1>
            <p className="mt-3 max-w-lg mx-auto text-[16px] leading-relaxed text-gray-500 dark:text-[#b8b5bd]">
              Paste your job description and resume to get an instant match score and actionable feedback.
            </p>
          </div>
          <div className="max-w-3xl mx-auto pb-10">
            <AnalysisForm user={user} onResult={handleResult} />
          </div>
        </>
      )}
    </div>
  );
}
