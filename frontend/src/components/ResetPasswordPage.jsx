import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Supabase sends a hash fragment (#type=recovery&access_token=...) not query params
  useEffect(() => {
    // Check if Supabase has already handled the recovery link
    // The hash fragment is processed by Supabase client automatically
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // User is authenticated via recovery token — they can set a new password
        setVerifying(false);
      } else {
        // Check hash fragment manually for older Supabase versions
        const hash = window.location.hash;
        if (hash.includes('type=recovery') || hash.includes('access_token')) {
          // Supabase client should handle this — wait briefly then check again
          setTimeout(async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              setVerifying(false);
            } else {
              setError('Invalid or expired reset link. Please request a new one.');
              setVerifying(false);
            }
          }, 1000);
        } else {
          setError('No reset token found. Please use the link from your email.');
          setVerifying(false);
        }
      }
    }
    checkSession();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => navigate('/dashboard', { replace: true }), 2000);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-[#080a12] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#f575ad] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-[#b8b5bd]">Verifying reset link…</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#080a12] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-[#f7f2ed] mb-2">Password updated</h1>
          <p className="text-sm text-[#b8b5bd]">Redirecting to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080a12] flex items-center justify-center px-6">
      <div className="w-full max-w-[420px] rounded-[24px] border border-white/[0.06] bg-[rgba(23,28,41,0.92)] p-8">
        <h1 className="text-2xl font-bold text-[#f7f2ed] tracking-[-0.03em]">
          Set new password
        </h1>
        <p className="mt-2 text-sm text-[#b8b5bd]">
          Enter your new password below.
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
            <label className="mb-1.5 block text-sm font-medium text-[#d7d4db]">
              New Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-xl border border-white/[0.06] bg-[rgba(40,47,66,0.95)] px-4 py-3 text-sm text-[#f7f2ed] placeholder:text-[#8f93a1] outline-none transition-colors focus:border-[#f575ad]/60 focus:ring-2 focus:ring-[#f575ad]/25"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#d7d4db]">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full rounded-xl border border-white/[0.06] bg-[rgba(40,47,66,0.95)] px-4 py-3 text-sm text-[#f7f2ed] placeholder:text-[#8f93a1] outline-none transition-colors focus:border-[#f575ad]/60 focus:ring-2 focus:ring-[#f575ad]/25"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="show-pw"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
              className="rounded border-white/20 bg-white/10 text-[#f575ad] focus:ring-[#f575ad]/25"
            />
            <label htmlFor="show-pw" className="text-sm text-[#b8b5bd]">
              Show passwords
            </label>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-[#f575ad] py-3.5 text-sm font-semibold text-[#0f1217] shadow-[0_16px_30px_rgba(242,125,184,0.28)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
