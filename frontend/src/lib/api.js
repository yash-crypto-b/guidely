const DEFAULT_API_BASE = 'http://localhost:4000';

export function getApiBase() {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  return DEFAULT_API_BASE;
}
