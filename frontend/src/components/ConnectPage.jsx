import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getApiBase } from '@/lib/api';
import { MentorOnboarding } from './MentorOnboarding';

const API_BASE = getApiBase();

export function ConnectPage({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isMentor, setIsMentor] = useState(false);

  useEffect(() => {
    fetchHistory();
    checkMentorStatus();
  }, []);

  async function fetchHistory() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/stats/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  }

  async function checkMentorStatus() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/v1/connections/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setIsMentor(true);
      }
    } catch {
      // Not a mentor yet
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-[1.4px] text-[#f27db8]">Connect</p>
          <h1 className="text-[clamp(1.5rem,3vw,2.25rem)] font-extrabold tracking-[-0.04em] text-gray-900 dark:text-[#f7f2ed]">Your Activity</h1>
        </div>

        {/* Become a Mentor Button */}
        {!isMentor && (
          <button
            onClick={() => setShowOnboarding(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#f575ad] to-[#c084fc] text-white hover:opacity-90 transition-all shadow-lg shadow-[#f575ad]/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Become a Mentor
          </button>
        )}

        {isMentor && (
          <a
            href="/connections/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-[#f575ad]/30 text-[#f575ad] hover:bg-[#f575ad]/10 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Mentor Dashboard
          </a>
        )}
      </div>

      {/* Mentor CTA Banner (for non-mentors) */}
      {!isMentor && (
        <div className="rounded-[20px] border border-[#f575ad]/20 bg-gradient-to-r from-[#f575ad]/10 via-[#c084fc]/10 to-[#f575ad]/10 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#f575ad] to-[#7c3aed] flex items-center justify-center text-white text-xl shrink-0">
              🎯
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-[#f7f2ed]">Share your expertise with others</h3>
              <p className="text-[13px] text-[#b8b5bd] mt-1">
                Set up your mentor profile, add your skills, upload your resume, and start offering guidance sessions. Earn money while helping others grow.
              </p>
            </div>
            <button
              onClick={() => setShowOnboarding(true)}
              className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#f575ad] text-[#0f1217] hover:opacity-90 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-[rgba(18,20,28,0.82)] rounded-xl w-fit">
        {['history', 'connections'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-[rgba(40,47,66,0.95)] text-gray-900 dark:text-[#f7f2ed] shadow-sm'
                : 'text-gray-500 dark:text-[#b8b5bd] hover:text-gray-700 dark:hover:text-[#f7f2ed]'
            }`}
          >
            {tab === 'history' ? 'Analysis History' : 'My Connections'}
          </button>
        ))}
      </div>

      {activeTab === 'history' ? (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-gray-400 dark:text-[#6b6e78] text-sm">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-[#f7f2ed] mb-2">No analyses yet</h3>
              <p className="text-sm text-gray-500 dark:text-[#b8b5bd]">Your analysis history will appear here once you start scoring resumes.</p>
            </div>
          ) : (
            history.map((item, i) => (
              <div key={i} className="rounded-[20px] border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[rgba(18,20,28,0.82)] p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 dark:text-[#f7f2ed] truncate">{item.job_title || 'Analysis'}</p>
                    <p className="text-[12px] text-gray-400 dark:text-[#6b6e78] mt-1">{item.company || 'Unknown company'}</p>
                  </div>
                  <span className={`shrink-0 ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    item.score >= 75 ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                    item.score >= 50 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                    'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}>
                    {item.score}%
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-[#6b6e78] mt-2">
                  {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🔗</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-[#f7f2ed] mb-2">No connections yet</h3>
          <p className="text-sm text-gray-500 dark:text-[#b8b5bd]">Connect with other professionals to share insights and referrals.</p>
        </div>
      )}

      {/* Mentor Onboarding Modal */}
      {showOnboarding && (
        <MentorOnboarding
          user={user}
          onComplete={() => {
            setIsMentor(true);
            setShowOnboarding(false);
          }}
          onClose={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
}
