'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { en, MessageKey } from './en';
import { hi } from './hi';

export type Lang = 'en' | 'hi';
export const LANG_COOKIE = 'ks_lang';
const dictionaries: Record<Lang, Record<MessageKey, string>> = { en, hi };

type Vars = Record<string, string | number | null | undefined>;

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: MessageKey, vars?: Vars) => string;
  /** For keys built from data, e.g. tk('status', booking.status). Falls back to the raw value. */
  tk: (prefix: string, value: string | null | undefined, vars?: Vars) => string;
  formatDate: (d: string | Date, opts?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (d: string | Date) => string;
  formatTime: (d: string | Date) => string;
  formatMoney: (n: number | null | undefined) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function interpolate(s: string, vars?: Vars) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined || vars[k] === null ? '' : String(vars[k])));
}

export function I18nProvider({ initialLang, children }: { initialLang: Lang; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=${365 * 86400}; samesite=lax`;
    try {
      localStorage.setItem(LANG_COOKIE, l);
    } catch {
      /* storage may be unavailable */
    }
  }, []);

  const value = useMemo<I18nValue>(() => {
    const dict = dictionaries[lang];
    const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
    const tz = { timeZone: 'Asia/Kolkata' } as const;
    const t = (key: MessageKey, vars?: Vars) => interpolate(dict[key] ?? en[key] ?? key, vars);
    return {
      lang,
      setLang,
      t,
      tk: (prefix, v, vars) => {
        if (!v) return '';
        const key = `${prefix}.${v}` as MessageKey;
        return key in dict ? t(key, vars) : v;
      },
      formatDate: (d, opts) =>
        new Date(d).toLocaleDateString(locale, { ...tz, day: 'numeric', month: 'short', year: 'numeric', ...opts }),
      formatDateTime: (d) =>
        new Date(d).toLocaleString(locale, { ...tz, weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }),
      formatTime: (d) => new Date(d).toLocaleTimeString(locale, { ...tz, hour: 'numeric', minute: '2-digit' }),
      formatMoney: (n) =>
        n === null || n === undefined
          ? '—'
          : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n),
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const v = useContext(I18nContext);
  if (!v) throw new Error('useI18n must be used inside I18nProvider');
  return v;
}

export type { MessageKey };
