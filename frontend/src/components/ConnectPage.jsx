import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getApiBase } from '@/lib/api';

const API_BASE = getApiBase();

export function ConnectPage({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history');

  useEffect(() => {
    fetchHistory();
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

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-[13px] font-semibold uppercase tracking-[1.4px] text-[#f27db8]">Connect</p>
        <h1 className="text-[clamp(1.5rem,3vw,2.25rem)] font-extrabold tracking-[-0.04em] text-gray-900 dark:text-[#f7f2ed]">Your Activity</h1>
      </div>

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
    </div>
  );
}
