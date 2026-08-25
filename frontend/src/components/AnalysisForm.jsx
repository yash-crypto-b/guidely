import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

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
        _meta: { jobDescription: jd, resumeText: resume },
      });
    } catch (err) {
      console.error('Analysis error:', err);
      if (err.name === 'AbortError') {
        setError('Analysis timed out after 120 seconds. The AI service may be overloaded — please try again in a minute.');
      } else if (err.message === 'Failed to fetch' || err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Cannot connect to the server. Please make sure the backend is running:\n\n1. Open a terminal\n2. Run: cd backend && npm run dev\n3. Wait for "Server running on port 4000"\n4. Refresh this page and try again');
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
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-t-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-900 dark:text-white">Job Description</label>
          <span className="text-xs text-gray-400 dark:text-gray-500">{jobDescription.length.toLocaleString()} / 5000</span>
        </div>
        <textarea
          rows={8}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here..."
          className="w-full resize-none text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none bg-transparent"
          disabled={busy}
        />
      </div>

      {/* Against divider */}
      <div className="flex items-center justify-center py-3 bg-gray-50 dark:bg-gray-800/50">
        <span className="text-xs font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Against</span>
      </div>

      {/* Resume */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-b-xl p-5">
        <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 block">Your Resume</label>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragOver ? 'border-[#5B5FC7] bg-[#5B5FC7]/5'
            : selectedFile ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
            : 'border-gray-200 dark:border-gray-600 hover:border-[#5B5FC7]/50 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          <input ref={fileInputRef} type="file" accept=".txt,.pdf" onChange={handleFileChange} className="hidden" disabled={busy} />
          {selectedFile ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-green-700 dark:text-green-400">{fileName}</span>
              <span className="text-xs text-green-600 dark:text-green-500">— Click to change</span>
            </div>
          ) : (
            <>
              <svg className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-semibold text-[#5B5FC7]">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PDF or TXT (Max 5MB)</p>
            </>
          )}
        </div>

        <div className="flex items-center justify-center py-4">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Or paste resume text</span>
        </div>

        <textarea
          rows={6}
          value={selectedFile && resumeText === '[PDF_UPLOADED]' ? '' : resumeText}
          onChange={(e) => { setResumeText(e.target.value); setFileName(''); setSelectedFile(null); }}
          placeholder="Paste your resume content here..."
          className="w-full resize-none text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-transparent"
          disabled={busy || !!selectedFile}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2.5">
            <svg className="h-5 w-5 text-red-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-red-700 dark:text-red-400">
              <p className="font-semibold mb-1">Analysis Error</p>
              {error.split('\n').map((line, i) => (
                <p key={i} className="text-red-600 dark:text-red-400">{line}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      {busy && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Analyzing your resume...</span>
            <span>{elapsedTime}s elapsed</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div 
              className="h-full bg-[#5B5FC7] rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${Math.min(90, elapsedTime * 6)}%` }} 
            />
          </div>
          <p className="text-xs text-center text-gray-400 dark:text-gray-500">Usually takes 5-15 seconds</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={handleClear}
          disabled={busy}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          Clear Form
        </button>
        <button
          type="submit"
          disabled={busy}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-[#5B5FC7] hover:bg-[#4A4EB5] rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
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
