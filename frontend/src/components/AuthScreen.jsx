import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/ThemeContext';

export function AuthScreen() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const isSignup = mode === 'signup';

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    
    try {
      const { data, error } = isSignup
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setError(error.message);
      } else if (data?.session) {
        // Login successful - navigate to dashboard
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white dark:bg-[#080a12] text-gray-900 dark:text-[#f7f2ed] transition-colors">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_22%,rgba(114,33,70,0.78),transparent_24%),radial-gradient(circle_at_86%_20%,rgba(242,125,184,0.18),transparent_18%),radial-gradient(circle_at_50%_100%,rgba(53,33,73,0.38),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%)]" />

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <button
          onClick={toggleTheme}
          className="rounded-full border border-gray-200 dark:border-white/8 bg-gray-100 dark:bg-[rgba(24,26,36,0.72)] p-2.5 text-gray-500 dark:text-[#b8b5bd] shadow-none dark:shadow-[0_12px_24px_rgba(0,0,0,0.2)] transition-colors hover:text-gray-900 dark:hover:text-[#f7f2ed]"
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
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-10">
        <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="hidden lg:flex lg:flex-col lg:justify-center lg:pr-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-3 rounded-full border border-gray-200 dark:border-white/8 bg-gray-100 dark:bg-[rgba(26,28,38,0.72)] px-4 py-2 text-sm text-gray-500 dark:text-[#b8b5bd]">
                <span className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-300 dark:border-[#f7c9e0] bg-gray-200 dark:bg-[rgba(31,31,46,0.92)] text-xs font-black text-gray-900 dark:text-[#f7f2ed]">
                  G
                </span>
                Guidely
              </div>
              <h1 className="mt-8 text-[clamp(3.2rem,5.6vw,5.4rem)] font-extrabold tracking-[-0.05em] text-gray-900 dark:text-[#f7f2ed]">
                The AI that gets
                <span className="block text-[#f27db8]">resumes hired.</span>
              </h1>
              <p className="mt-6 max-w-[620px] text-[clamp(1.1rem,1.6vw,1.5rem)] leading-[1.55] text-gray-500 dark:text-[#b8b5bd]">
                Guidely finds your next role, tailors every resume, preps every interview, and helps you move faster from application to offer.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-[520px] overflow-hidden rounded-[24px] border border-gray-200 dark:border-white/8 bg-white dark:bg-[rgba(23,28,41,0.92)] shadow-xl dark:shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
              <div className="h-1 bg-[#f575ad]" />

              <div className="border-b border-gray-200 dark:border-white/8">
                <div className="grid grid-cols-2">
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(''); }}
                    className={`relative py-4 text-sm font-semibold transition-colors ${
                      mode === 'signin' ? 'text-[#f575ad]' : 'text-gray-500 dark:text-[#b8b5bd] hover:text-gray-900 dark:hover:text-[#f7f2ed]'
                    }`}>
                    Sign In
                    {mode === 'signin' && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#f575ad]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setError(''); }}
                    className={`relative py-4 text-sm font-semibold transition-colors ${
                      mode === 'signup' ? 'text-[#f575ad]' : 'text-gray-500 dark:text-[#b8b5bd] hover:text-gray-900 dark:hover:text-[#f7f2ed]'
                    }`}>
                    Sign Up
                    {mode === 'signup' && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#f575ad]" />}
                  </button>
                </div>
              </div>

              <div className="px-6 py-7 sm:px-8 sm:py-8">
                <h2 className="text-2xl font-bold tracking-[-0.03em] text-gray-900 dark:text-[#f7f2ed]">
                  {isSignup ? 'Create your account' : 'Welcome back'}
                </h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-[#b8b5bd]">
                  {isSignup
                    ? 'Start analyzing resumes and generating tailored applications.'
                    : 'Sign in to continue your career workflow.'}
                </p>

                {error && (
                  <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={onSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-[#d7d4db]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full rounded-xl border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-[rgba(40,47,66,0.95)] px-4 py-3 text-sm text-gray-900 dark:text-[#f7f2ed] placeholder:text-gray-400 dark:placeholder:text-[#8f93a1] outline-none transition-colors focus:border-[#f575ad]/60 focus:ring-2 focus:ring-[#f575ad]/25"
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 dark:text-[#d7d4db]">
                        Password
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          className="text-xs font-medium text-[#f575ad] hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={isSignup ? 'new-password' : 'current-password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-[rgba(40,47,66,0.95)] px-4 py-3 pr-10 text-sm text-gray-900 dark:text-[#f7f2ed] placeholder:text-gray-400 dark:placeholder:text-[#8f93a1] outline-none transition-colors focus:border-[#f575ad]/60 focus:ring-2 focus:ring-[#f575ad]/25"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#8f93a1] transition-colors hover:text-gray-900 dark:hover:text-[#f7f2ed]"
                      >
                        {showPassword ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="mt-6 w-full rounded-xl bg-[#f575ad] py-3.5 text-sm font-semibold text-[#0f1217] shadow-[0_16px_30px_rgba(242,125,184,0.28)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? 'Please wait…' : isSignup ? 'Create Account' : 'Sign In'}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500 dark:text-[#b8b5bd]">
                  {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => { setMode(isSignup ? 'signin' : 'signup'); setError(''); }}
                    className="font-medium text-[#f575ad] hover:underline"
                  >
                    {isSignup ? 'Sign In' : 'Create one'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthScreen;
