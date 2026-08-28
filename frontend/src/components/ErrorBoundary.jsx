import { Component } from 'react';
import { Link } from 'react-router-dom';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080a12] flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-[#f7f2ed]">
              Something went wrong
            </h1>
            <p className="mt-3 text-sm text-[#b8b5bd] leading-relaxed">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="rounded-full bg-[#f575ad] px-6 py-3 text-sm font-semibold text-[#0f1217] hover:opacity-90 transition-opacity"
              >
                Refresh page
              </button>
              <Link
                to="/"
                className="rounded-full border border-white/10 px-6 py-3 text-sm font-medium text-[#f7f2ed] hover:bg-white/5 transition-colors"
              >
                Go home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
