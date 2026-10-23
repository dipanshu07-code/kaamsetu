'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { dashboardPath, useSession } from '@/lib/session';
import { Alert, Button, TextField, useApiError } from '@/components/ui';

function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const next = useSearchParams().get('next');
  const { refresh, config, setLanguage } = useSession();
  const errorText = useApiError();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signIn = async (p: string, pw: string) => {
    setBusy(true);
    setError(null);
    try {
      await api.post('/api/auth/login', { phone: p, password: pw });
      const u = await refresh();
      if (u) setLanguage(u.language);
      // Only allow same-site relative redirects.
      router.push(next && next.startsWith('/') && !next.startsWith('//') ? next : dashboardPath(u?.role));
    } catch (e) {
      setError(errorText(e));
      setBusy(false);
    }
  };

  const demo = config?.demoMode && config.demoAccounts;

  return (
    <div className="container-page max-w-md py-10">
      <h1 className="text-2xl font-bold text-stone-900">{t('auth.loginTitle')}</h1>
      <p className="mt-1 text-stone-600">{t('auth.loginSubtitle')}</p>

      <form
        className="card mt-6 space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          signIn(phone, password);
        }}
        noValidate
      >
        {error && <Alert tone="error">{error}</Alert>}
        <TextField label={t('common.phone')} type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <TextField label={t('common.password')} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" loading={busy} className="w-full">
          {busy ? t('auth.loggingIn') : t('auth.loginButton')}
        </Button>
        <p className="text-sm text-stone-600">{t('auth.otpNotice')}</p>
        <p className="text-sm text-stone-600">
          {t('auth.forgot')}{' '}
          <Link href="/grievance" className="link">{t('nav.grievance')}</Link>
        </p>
      </form>

      <p className="mt-4 text-center text-sm text-stone-700">
        {t('auth.noAccount')}{' '}
        <Link href="/signup" className="link">
          {t('auth.createAccount')}
        </Link>
      </p>

      {demo && (
        <div className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">{t('demo.quickLogin')}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(
              [
                ['customer', 'demo.customer'],
                ['worker', 'demo.worker'],
                ['plumber', 'demo.plumber'],
                ['employer', 'demo.employer'],
                ['admin', 'demo.admin'],
              ] as const
            ).map(([k, label]) => (
              <Button key={k} variant="secondary" disabled={busy} onClick={() => signIn(demo[k], config!.demoPassword || '')}>
                {t(label)}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
