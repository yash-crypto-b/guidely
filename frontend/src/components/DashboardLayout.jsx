import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/ThemeContext';
import { Link } from 'react-router-dom';
import LineSidebar from './LineSidebar';

const NAV_ITEMS = ['Dashboard', 'Connect', 'Profile'];
const ROUTE_MAP = { Dashboard: '/dashboard', Connect: '/connect', Profile: '/profile' };

export function DashboardLayout({ user, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, toggleTheme } = useTheme();

  const activeIndex = NAV_ITEMS.findIndex(item => location.pathname === ROUTE_MAP[item]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#080a12] text-gray-900 dark:text-[#f7f2ed] transition-colors">
      {/* Ambient background — dark mode only */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(114,33,70,0.65),transparent_26%),radial-gradient(circle_at_84%_40%,rgba(242,125,184,0.18),transparent_18%),radial-gradient(circle_at_50%_100%,rgba(53,33,73,0.35),transparent_24%)] opacity-80 dark:opacity-80 opacity-0" />

      {/* Header */}
      <header className="relative z-10 border-b border-transparent dark:border-transparent">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              <svg className="h-8 w-8" viewBox="0 0 36 36" fill="none">
                <rect x="1" y="1" width="34" height="34" rx="10" stroke="currentColor" strokeWidth="1.5" className="text-gray-300 dark:text-[#f7c9e0]/40" fill="currentColor" fillOpacity="0.05" dark:fillOpacity="1" />
                <path d="M18 9C13.03 9 9 13.03 9 18s4.03 9 9 9c3.14 0 5.88-1.61 7.48-4.05" stroke="#f575ad" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <circle cx="23" cy="13" r="2" fill="#f575ad" />
              </svg>
              <span className="text-base font-bold tracking-tight text-gray-900 dark:text-[#f7f2ed]">guidely</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="rounded-full border border-gray-200 dark:border-white/[0.06] bg-gray-100 dark:bg-[rgba(24,26,36,0.72)] p-2 text-gray-500 dark:text-[#b8b5bd] transition-colors hover:text-gray-900 dark:hover:text-[#f7f2ed]"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>
            <div className="h-4 w-px bg-gray-200 dark:bg-white/[0.08]" />
            <span className="hidden sm:inline text-[13px] text-gray-400 dark:text-[#6b6e78]">{user.email}</span>
            <button onClick={() => supabase.auth.signOut()} className="text-[13px] font-medium text-gray-500 dark:text-[#b8b5bd] transition-colors hover:text-gray-900 dark:hover:text-[#f7f2ed]">
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content with sidebar */}
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 py-8">
        <div className="flex gap-10">
          {/* Sidebar */}
          <aside className="hidden lg:block shrink-0 w-56 sticky top-8 self-start">
            <LineSidebar
              items={NAV_ITEMS}
              accentColor="#f575ad"
              textColor="#6b6e78"
              markerColor="#3a3d47"
              showIndex={false}
              showMarker={true}
              proximityRadius={80}
              maxShift={20}
              itemGap={8}
              fontSize={0.95}
              smoothing={100}
              defaultActive={activeIndex >= 0 ? activeIndex : 0}
              markerLength={30}
              tickScale={0.4}
              onItemClick={(i, label) => navigate(ROUTE_MAP[label])}
            />
          </aside>

          {/* Page content */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
