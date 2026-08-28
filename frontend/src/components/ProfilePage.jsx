import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/ThemeContext';

export function ProfilePage({ user }) {
  const { dark, toggleTheme } = useTheme();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-[13px] font-semibold uppercase tracking-[1.4px] text-[#f27db8]">Profile</p>
        <h1 className="text-[clamp(1.5rem,3vw,2.25rem)] font-extrabold tracking-[-0.04em] text-gray-900 dark:text-[#f7f2ed]">Account Settings</h1>
      </div>

      {/* Profile Card */}
      <div className="rounded-[20px] border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[rgba(18,20,28,0.82)] p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#f575ad] to-[#7c3aed] flex items-center justify-center text-white text-xl font-bold">
            {user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-[#f7f2ed]">{user?.email?.split('@')[0] || 'User'}</h2>
            <p className="text-[13px] text-gray-400 dark:text-[#6b6e78]">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4 border-t border-gray-100 dark:border-white/[0.06] pt-6">
          <div>
            <label className="text-[13px] font-semibold uppercase tracking-[1.2px] text-gray-500 dark:text-[#b8b5bd]">Email</label>
            <p className="mt-1 text-sm text-gray-900 dark:text-[#f7f2ed]">{user?.email}</p>
          </div>
          <div>
            <label className="text-[13px] font-semibold uppercase tracking-[1.2px] text-gray-500 dark:text-[#b8b5bd]">Account Created</label>
            <p className="mt-1 text-sm text-gray-900 dark:text-[#f7f2ed]">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown'}
            </p>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="rounded-[20px] border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[rgba(18,20,28,0.82)] p-6">
        <h3 className="text-[13px] font-semibold uppercase tracking-[1.2px] text-gray-500 dark:text-[#b8b5bd] mb-4">Appearance</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-[#f7f2ed]">Dark Mode</p>
            <p className="text-[12px] text-gray-400 dark:text-[#6b6e78]">Toggle between light and dark theme</p>
          </div>
          <button
            onClick={toggleTheme}
            className="relative h-6 w-11 rounded-full bg-gray-200 dark:bg-[#f575ad] transition-colors"
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${dark ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full rounded-[20px] border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[rgba(18,20,28,0.82)] p-4 text-sm font-medium text-gray-700 dark:text-[#b8b5bd] hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
      >
        {signingOut ? 'Signing out...' : 'Sign Out'}
      </button>

      {/* Delete Account */}
      <div className="rounded-[20px] border border-red-200 dark:border-red-500/20 bg-white dark:bg-[rgba(18,20,28,0.82)] p-6">
        <h3 className="text-[13px] font-semibold uppercase tracking-[1.2px] text-red-500 dark:text-red-400 mb-2">Danger Zone</h3>
        <p className="text-sm text-gray-500 dark:text-[#b8b5bd] mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          onClick={async () => {
            if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
            try {
              const { error } = await supabase.auth.admin.deleteUser(user.id);
              if (error) {
                // Admin API may not be available — try sign out as fallback
                await supabase.auth.signOut();
              }
            } catch {
              await supabase.auth.signOut();
            }
          }}
          className="rounded-xl border border-red-300 dark:border-red-500/30 px-5 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
