const DEFAULT_API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:4000'
  : 'https://guidely-1.onrender.com';

export function getApiBase() {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  return DEFAULT_API_BASE;
}
