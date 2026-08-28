import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase, isConfigured } from '@/lib/supabase';
import { AuthScreen } from '@/components/AuthScreen';
import { Home } from '@/components/Home';
import { ConnectPage } from '@/components/ConnectPage';
import { ProfilePage } from '@/components/ProfilePage';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ThemeProvider } from '@/lib/ThemeContext';
import { LandingPage } from '@/components/LandingPage';
import { PrivacyPolicy } from '@/components/PrivacyPolicy';
import { TermsOfService } from '@/components/TermsOfService';
import { AboutPage } from '@/components/AboutPage';
import { ServicesPage } from '@/components/ServicesPage';
import { SupportPage } from '@/components/SupportPage';
import { NotFoundPage } from '@/components/NotFoundPage';
import { ResetPasswordPage } from '@/components/ResetPasswordPage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/OfflineBanner';

function ConfigError() {
  return (
    <div className="min-h-screen bg-[#080a12] flex items-center justify-center p-6">
      <div className="max-w-md rounded-[24px] border border-white/[0.06] bg-[rgba(23,28,41,0.92)] p-8 text-center">
        <h1 className="text-2xl font-bold text-red-400 mb-4">Missing Configuration</h1>
        <p className="text-[#b8b5bd] mb-4">
          This app requires Supabase configuration. Add these environment variables:
        </p>
        <code className="block text-left text-sm bg-[rgba(40,47,66,0.95)] p-4 rounded-xl mb-4 text-[#f7f2ed] font-mono">
          VITE_SUPABASE_URL=your-project-url<br />
          VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
        </code>
        <p className="text-sm text-[#6b6e78]">
          Then redeploy the application.
        </p>
      </div>
    </div>
  );
}

function SessionExpiredNotice() {
  return (
    <div className="min-h-screen bg-[#080a12] flex items-center justify-center p-6">
      <div className="max-w-md rounded-[24px] border border-white/[0.06] bg-[rgba(23,28,41,0.92)] p-8 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-[#f7f2ed] mb-2">Session expired</h1>
        <p className="text-sm text-[#b8b5bd] mb-6">
          Your session has expired. Please sign in again to continue.
        </p>
        <a
          href="/login"
          className="inline-block rounded-full bg-[#f575ad] px-6 py-3 text-sm font-semibold text-[#0f1217] hover:opacity-90 transition-opacity"
        >
          Sign in
        </a>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const handleSessionExpired = useCallback(() => {
    setSession(null);
    setSessionExpired(true);
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setSessionExpired(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Intercept fetch to detect 401 (session expired) on API calls
  useEffect(() => {
    if (!session) return;

    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const res = await originalFetch.apply(this, args);
      // Only handle 401 from our own backend, not Supabase auth calls
      if (res.status === 401 && typeof args[0] === 'string' && args[0].includes('/api/')) {
        const cloned = res.clone();
        try {
          const body = await cloned.json();
          if (body.code === 'TOKEN_EXPIRED' || body.error?.includes('expired')) {
            handleSessionExpired();
          }
        } catch {
          // ignore parse errors
        }
      }
      return res;
    };

    return () => { window.fetch = originalFetch; };
  }, [session, handleSessionExpired]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#080a12]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#f575ad] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[#6b6e78] text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (sessionExpired) {
    return <SessionExpiredNotice />;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <OfflineBanner />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={
              session ? <Navigate to="/dashboard" replace /> : <LandingPage />
            } />

            <Route path="/login" element={
              !isConfigured ? <ConfigError /> : session ? <Navigate to="/dashboard" replace /> : <AuthScreen />
            } />

            <Route path="/signup" element={
              !isConfigured ? <ConfigError /> : session ? <Navigate to="/dashboard" replace /> : <AuthScreen />
            } />

            {/* Password reset — Supabase sends users here from email link */}
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Public info pages */}
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/:service" element={<ServicesPage />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              !isConfigured ? <ConfigError /> : session
                ? <DashboardLayout user={session.user}><Home user={session.user} /></DashboardLayout>
                : <Navigate to="/login" replace />
            } />
            <Route path="/connect" element={
              !isConfigured ? <ConfigError /> : session
                ? <DashboardLayout user={session.user}><ConnectPage user={session.user} /></DashboardLayout>
                : <Navigate to="/login" replace />
            } />
            <Route path="/profile" element={
              !isConfigured ? <ConfigError /> : session
                ? <DashboardLayout user={session.user}><ProfilePage user={session.user} /></DashboardLayout>
                : <Navigate to="/login" replace />
            } />

            {/* 404 — catch all unmatched routes */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
