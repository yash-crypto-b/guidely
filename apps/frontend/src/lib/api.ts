const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  token?: string;
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export const api = {
  get: <T>(path: string, token?: string) =>
    request<T>(path, { method: 'GET', token: token || getToken() || undefined }),

  post: <T>(path: string, body?: any, token?: string) =>
    request<T>(path, { method: 'POST', body, token: token || getToken() || undefined }),

  put: <T>(path: string, body?: any, token?: string) =>
    request<T>(path, { method: 'PUT', body, token: token || getToken() || undefined }),

  patch: <T>(path: string, body?: any, token?: string) =>
    request<T>(path, { method: 'PATCH', body, token: token || getToken() || undefined }),

  delete: <T>(path: string, token?: string) =>
    request<T>(path, { method: 'DELETE', token: token || getToken() || undefined }),
};

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
