import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getApiBase } from '@/lib/api';

const API_BASE = getApiBase();

export function AnalysisForm({ user, onResult }) {
  const [token, setToken] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token || '');
    });
  }, []);

  useEffect(() => {
    let interval;
    let startTime;
    if (busy) {
      startTime = Date.now();
      setElapsedTime(0);
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [busy]);

  function handleClear() {
    setJobDescription('');
    setResumeText('');
    setFileName('');
    setError('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function processFile(file) {
    if (!file) return;
    if (!['.txt', '.pdf'].some(ext => file.name.toLowerCase().endsWith(ext))) {
      setError('Please upload a .txt or .pdf file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    setFileName(file.name);
    setError('');
    setSelectedFile(file);
    if (file.name.toLowerCase().endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (e) => setResumeText(e.target.result);
      reader.readAsText(file);
    } else {
      setResumeText('[PDF_UPLOADED]');
    }
  }

  function handleFileChange(e) { processFile(e.target.files?.[0]); }
  function handleDrop(e) { e.preventDefault(); setIsDragOver(false); processFile(e.dataTransfer.files?.[0]); }
  function handleDragOver(e) { e.preventDefault(); setIsDragOver(true); }
  function handleDragLeave() { setIsDragOver(false); }

  async function onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    setError('');

    const jd = jobDescription.trim();
    const resume = resumeText.trim();

    if (!jd) { setError('Please paste a job description'); return; }
    if (jd.length < 50) { setError('Job description must be at least 50 characters'); return; }
    if (!resume && !selectedFile) { setError('Please upload or paste your resume'); return; }
    if (resume && resume !== '[PDF_UPLOADED]' && resume.length < 20) { setError('Resume must be at least 20 characters'); return; }
    if (!token) { setError('Session not ready. Please wait and try again.'); return; }

    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('jobDescription', jd);
      if (selectedFile) {
        formData.append('resumeFile', selectedFile);
      } else {
        formData.append('resumeText', resume);
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 120_000);

      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timer);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
      if (typeof data.ats_score !== 'number') throw new Error('Invalid response from server');

      onResult({
        ...data,
        _meta: { jobDescription: jd, resumeText: data.parsedResumeText || resume },
      });
    } catch (err) {
      console.error('Analysis error:', err);
      if (err.name === 'AbortError') {
        setError('Analysis timed out after 120 seconds. The AI service may be overloaded — please try again in a minute.');
      } else if (err.message === 'Failed to fetch' || err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('We could not reach the analysis server. Please make sure the backend is running, then try again.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-0">
      {/* Job Description */}
      <div className="rounded-t-[20px] border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[rgba(18,20,28,0.82)] p-6">
        <div className="flex items-center justify-between mb-4">
          <label className="text-[13px] font-semibold uppercase tracking-[1.2px] text-gray-500 dark:text-[#b8b5bd]">Job Description</label>
          <span className="text-[12px] text-gray-400 dark:text-[#6b6e78]">{jobDescription.length.toLocaleString()} / 5000</span>
        </div>
        <textarea
          rows={8}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here..."
          className="w-full resize-none text-[15px] text-gray-900 dark:text-[#f7f2ed] placeholder-gray-400 dark:placeholder-[#6b6e78] focus:outline-none bg-transparent leading-relaxed"
          disabled={busy}
        />
      </div>

      {/* Against divider */}
      <div className="flex items-center justify-center py-3 bg-gray-50 dark:bg-[rgba(18,20,28,0.5)] border-x border-gray-200 dark:border-white/[0.06]">
        <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 dark:text-[#6b6e78]">Against</span>
      </div>

      {/* Resume */}
      <div className="rounded-b-[20px] border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[rgba(18,20,28,0.82)] p-6">
        <label className="text-[13px] font-semibold uppercase tracking-[1.2px] text-gray-500 dark:text-[#b8b5bd] mb-4 block">Your Resume</label>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-[#f575ad]/50 bg-[#f575ad]/[0.04]'
              : selectedFile
                ? 'border-[#22c55e]/30 bg-[#22c55e]/[0.04]'
                : 'border-gray-300 dark:border-white/[0.08] hover:border-pink-300 dark:hover:border-[#f575ad]/30 hover:bg-gray-50 dark:hover:bg-white/[0.02]'
          }`}
        >
          <input ref={fileInputRef} type="file" accept=".txt,.pdf" onChange={handleFileChange} className="hidden" disabled={busy} />
          {selectedFile ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-[#22c55e]">{fileName}</span>
              <span className="text-[12px] text-[#6b6e78]">— Click to change</span>
            </div>
          ) : (
            <>
              <svg className="h-8 w-8 mx-auto text-[#6b6e78] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm text-gray-600 dark:text-[#b8b5bd]">
                <span className="font-semibold text-[#f575ad]">Click to upload</span> or drag and drop
              </p>
              <p className="text-[12px] text-gray-400 dark:text-[#6b6e78] mt-1">PDF or TXT (Max 5MB)</p>
            </>
          )}
        </div>

        <div className="flex items-center justify-center py-4">
          <span className="text-[12px] font-medium text-gray-400 dark:text-[#6b6e78]">Or paste resume text</span>
        </div>

        <textarea
          rows={6}
          value={selectedFile && resumeText === '[PDF_UPLOADED]' ? '' : resumeText}
          onChange={(e) => { setResumeText(e.target.value); setFileName(''); setSelectedFile(null); }}
          placeholder="Paste your resume content here..."
          className="w-full resize-none text-[15px] text-gray-900 dark:text-[#f7f2ed] placeholder-gray-400 dark:placeholder-[#6b6e78] focus:outline-none border border-gray-200 dark:border-white/[0.08] rounded-xl p-4 bg-transparent leading-relaxed transition-colors focus:border-[#f575ad]/30"
          disabled={busy || !!selectedFile}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 rounded-xl border border-red-500/20 bg-red-500/[0.06]">
          <div className="flex items-start gap-2.5">
            <svg className="h-4 w-4 text-red-400 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-red-300">
              <p className="font-semibold mb-1 text-red-200">Analysis Error</p>
              {error.split('\n').map((line, i) => (
                <p key={i} className="text-red-300/80">{line}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      {busy && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-[12px] text-[#6b6e78]">
            <span>Analyzing your resume...</span>
            <span>{elapsedTime}s elapsed</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full bg-[#f575ad] rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(90, elapsedTime * 6)}%` }}
            />
          </div>
          <p className="text-[12px] text-center text-[#6b6e78]">Usually takes 5–15 seconds</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={handleClear}
          disabled={busy}
          className="px-5 py-2.5 text-[14px] font-medium text-gray-600 dark:text-[#b8b5bd] border border-gray-200 dark:border-white/[0.08] rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.04] disabled:opacity-50 transition-colors"
        >
          Clear
        </button>
        <button
          type="submit"
          disabled={busy}
          className="px-6 py-2.5 text-[14px] font-semibold text-[#0f1217] bg-[#f575ad] rounded-xl shadow-[0_12px_28px_rgba(242,125,184,0.24)] disabled:opacity-50 transition-transform hover:-translate-y-0.5 flex items-center gap-2"
        >
          {busy ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              Get ATS Match Score
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
