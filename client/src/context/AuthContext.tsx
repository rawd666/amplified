import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getToken, setToken } from '../lib/api';
import type { Admin } from '../lib/types';

interface AuthValue {
  admin: Admin | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [ready, setReady] = useState(false);

  // Restore the session on refresh; a stale token just drops you at the login.
  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return;
    }
    api<{ admin: Admin }>('/auth/me')
      .then((r) => setAdmin(r.admin))
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await api<{ token: string; admin: Admin }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(res.token);
    setAdmin(res.admin);
  };

  const signOut = () => {
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, ready, signIn, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
