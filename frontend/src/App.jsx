import { useEffect, useState } from 'react';
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
import { AboutPage } from '@/components/AboutPage';
import { ServicesPage } from '@/components/ServicesPage';

function ConfigError() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Missing Environment Variables</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          This app requires Supabase configuration. Add these variables in your Vercel dashboard:
        </p>
        <code className="block text-left text-sm bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4 text-gray-800 dark:text-gray-200">
          VITE_SUPABASE_URL=your-project-url<br />
          VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
        </code>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Then redeploy this project.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

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
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#5B5FC7] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public Routes - show landing page if not logged in */}
          <Route path="/" element={
            session ? <Navigate to="/dashboard" replace /> : <LandingPage />
          } />
          
          <Route path="/login" element={
            !isConfigured ? <ConfigError /> : session ? <Navigate to="/dashboard" replace /> : <AuthScreen />
          } />
          
          <Route path="/signup" element={
            !isConfigured ? <ConfigError /> : session ? <Navigate to="/dashboard" replace /> : <AuthScreen />
          } />
          
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:service" element={<ServicesPage />} />
          
          {/* Protected Routes - require auth */}
          <Route path="/dashboard" element={
            !isConfigured ? <ConfigError /> : session ? <DashboardLayout user={session.user}><Home user={session.user} /></DashboardLayout> : <Navigate to="/login" replace />
          } />
          <Route path="/connect" element={
            !isConfigured ? <ConfigError /> : session ? <DashboardLayout user={session.user}><ConnectPage user={session.user} /></DashboardLayout> : <Navigate to="/login" replace />
          } />
          <Route path="/profile" element={
            !isConfigured ? <ConfigError /> : session ? <DashboardLayout user={session.user}><ProfilePage user={session.user} /></DashboardLayout> : <Navigate to="/login" replace />
          } />
          
          {/* Fallback - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
