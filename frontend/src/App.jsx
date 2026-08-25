import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AuthScreen } from '@/components/AuthScreen';
import { Home } from '@/components/Home';
import { ThemeProvider } from '@/lib/ThemeContext';
import { LandingPage } from '@/components/LandingPage';
import { PrivacyPolicy } from '@/components/PrivacyPolicy';
import { AboutPage } from '@/components/AboutPage';
import { ServicesPage } from '@/components/ServicesPage';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
            session ? <Navigate to="/dashboard" replace /> : <AuthScreen />
          } />
          
          <Route path="/signup" element={
            session ? <Navigate to="/dashboard" replace /> : <AuthScreen />
          } />
          
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:service" element={<ServicesPage />} />
          
          {/* Protected Routes - require auth */}
          <Route path="/dashboard" element={
            session ? <Home user={session.user} /> : <Navigate to="/login" replace />
          } />
          
          {/* Fallback - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
