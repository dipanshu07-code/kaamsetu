'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';
import { useI18n, Lang } from './i18n';
import type { UserRole } from '@/types';

export interface SessionUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  locality: string | null;
  city: string | null;
  localityId: string | null;
  language: Lang;
  organisationName: string | null;
  workerProfileId: string | null;
  unreadNotifications: number;
  unreadConversations: number;
}

export interface AppConfig {
  demoMode: boolean;
  demoAccounts: Record<string, string> | null;
  demoPassword: string | null;
  verificationProvider: { configured: boolean };
  smsOtpConfigured: boolean;
}

interface SessionValue {
  user: SessionUser | null;
  loading: boolean;
  config: AppConfig | null;
  refresh: () => Promise<SessionUser | null>;
  logout: () => Promise<void>;
  setLanguage: (l: Lang) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { lang, setLang } = useI18n();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<AppConfig | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { user } = await api.get<{ user: SessionUser | null }>('/api/me');
      setUser(user);
      return user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().then((u) => {
      // A signed-in user's saved language wins over the browser cookie.
      if (u && u.language !== lang) setLang(u.language);
    });
    api.get<AppConfig>('/api/config').then(setConfig).catch(() => setConfig(null));
    // Poll for unread counts (no realtime provider is configured).
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  const setLanguage = useCallback(
    (l: Lang) => {
      setLang(l);
      if (user) api.patch('/api/me', { language: l }).catch(() => undefined);
    },
    [setLang, user],
  );

  return (
    <SessionContext.Provider value={{ user, loading, config, refresh, logout, setLanguage }}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const v = useContext(SessionContext);
  if (!v) throw new Error('useSession must be used inside SessionProvider');
  return v;
}

export function dashboardPath(role: UserRole | undefined) {
  if (role === 'worker') return '/worker/dashboard';
  if (role === 'employer') return '/employer/dashboard';
  if (role === 'admin') return '/admin';
  return '/customer/dashboard';
}
