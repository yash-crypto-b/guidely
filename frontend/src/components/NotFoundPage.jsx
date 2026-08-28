import { Link } from 'react-router-dom';
import { SEO } from './SEO';

export function NotFoundPage() {
  return (
    <>
      <SEO title="Page Not Found — Guidely" noIndex={true} />
      <div className="min-h-screen bg-[#080a12] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-[80px] sm:text-[100px] font-extrabold tracking-[-0.06em] text-[#f575ad] leading-none">
            404
          </p>
          <h1 className="mt-4 text-xl font-bold text-[#f7f2ed]">
            Page not found
          </h1>
          <p className="mt-3 text-sm text-[#b8b5bd] leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              to="/"
              className="rounded-full bg-[#f575ad] px-6 py-3 text-sm font-semibold text-[#0f1217] hover:opacity-90 transition-opacity"
            >
              Go home
            </Link>
            <Link
              to="/dashboard"
              className="rounded-full border border-white/10 px-6 py-3 text-sm font-medium text-[#f7f2ed] hover:bg-white/5 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default NotFoundPage;
