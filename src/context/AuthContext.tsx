'use client';

import axios from 'axios';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { backendApi } from '../lib/backendApi';

export type Me = { email: string; name?: string; role?: 'user' | 'admin' };


type AuthContextValue = {
  me: Me | null;
  authChecked: boolean;
  authError: string | null;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshMe = useCallback(async () => {
    setAuthError(null);
    try {
      const res = await backendApi.get('/auth/me');
      setMe(res.data?.user ?? null);
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;

      // not logged in
      if (status === 401 || status === 403) {
        setMe(null);
      } else {
        // backend unreachable / CORS / server error
        setMe(null);
        setAuthError('Could not reach the backend. Is the server running?');
      }
    } finally {
      setAuthChecked(true);
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthError(null);
    try {
      await backendApi.post('/auth/logout');
    } catch {
      // ignore (still clear UI state)
    } finally {
      setMe(null);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const value = useMemo(
    () => ({ me, authChecked, authError, refreshMe, logout }),
    [me, authChecked, authError, refreshMe, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider />');
  return ctx;
}
