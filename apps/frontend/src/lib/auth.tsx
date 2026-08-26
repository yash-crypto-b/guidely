'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setTokens, clearTokens, getToken } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  photoUrl?: string;
  bio?: string;
  headline?: string;
  role: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    try {
      const token = getToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await api.get<{ data: User }>('/auth/me');
      setUser(res.data);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshUser(); }, []);

  async function login(email: string, password: string) {
    const res = await api.post<{ data: { user: User; accessToken: string; refreshToken: string } }>('/auth/login', { email, password });
    setTokens(res.data.accessToken, res.data.refreshToken);
    setUser(res.data.user);
  }

  async function register(email: string, password: string, name: string) {
    const res = await api.post<{ data: { user: User; accessToken: string; refreshToken: string } }>('/auth/register', { email, password, name });
    setTokens(res.data.accessToken, res.data.refreshToken);
    setUser(res.data.user);
  }

  function logout() {
    clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
