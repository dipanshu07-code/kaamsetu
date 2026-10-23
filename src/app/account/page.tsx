'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { Alert, Button, PageHeader, RequireRole, Section, TextField, useApiError } from '@/components/ui';
import { LocalityPicker, LocalityValue } from '@/components/domain';
import LanguageSwitch from '@/components/LanguageSwitch';

function Account() {
  const { t, tk } = useI18n();
  const { user, refresh } = useSession();
  const router = useRouter();
  const errorText = useApiError();
  const [name, setName] = useState(user?.name || '');
  const [loc, setLoc] = useState<LocalityValue>({ localityId: user?.localityId || null, localityText: user?.locality || '', city: user?.city || '' });
  const [details, setDetails] = useState<{ busy?: boolean; error?: string; ok?: boolean }>({});
  const [pw, setPw] = useState({ current: '', next: '' });
  const [pwState, setPwState] = useState<{ busy?: boolean; error?: string }>({});
  const [delPw, setDelPw] = useState('');
  const [delState, setDelState] = useState<{ busy?: boolean; error?: string }>({});
  if (!user) return null;

  return (
    <div className="space-y-6">
      <Section title={t('account.profile')}>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setDetails({ busy: true });
            try {
              await api.patch('/api/me', { fullName: name.trim(), city: loc.city, localityId: loc.localityId, localityText: loc.localityId ? undefined : loc.localityText });
              await refresh();
              setDetails({ ok: true });
            } catch (err) {
              setDetails({ error: errorText(err) });
            }
          }}
        >
          {details.error && <Alert tone="error">{details.error}</Alert>}
          {details.ok && <Alert tone="success">{t('common.saved')}</Alert>}
          <p className="text-sm text-stone-700">
            {tk('role', user.role)} · {t('common.phone')}: {user.phone}
          </p>
          <TextField label={t('common.name')} value={name} required maxLength={150} onChange={(e) => setName(e.target.value)} />
          <LocalityPicker value={loc} onChange={setLoc} />
          <Button type="submit" loading={details.busy}>{t('common.save')}</Button>
        </form>
      </Section>

      <Section title={t('account.languagePref')}>
        <p className="mb-3 text-sm text-stone-600">{t('account.languageHint')}</p>
        <LanguageSwitch />
      </Section>

      <Section title={t('account.changePassword')}>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (pw.next.length < 8) return setPwState({ error: t('validation.password_short') });
            setPwState({ busy: true });
            try {
              await api.post('/api/me/password', pw);
              await refresh();
              router.push('/login');
            } catch (err) {
              setPwState({ error: errorText(err) });
            }
          }}
        >
          {pwState.error && <Alert tone="error">{pwState.error}</Alert>}
          <TextField label={t('account.currentPassword')} type="password" autoComplete="current-password" value={pw.current} required onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          <TextField label={t('account.newPassword')} type="password" autoComplete="new-password" hint={t('auth.passwordHint')} value={pw.next} required onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          <Button type="submit" variant="secondary" loading={pwState.busy}>{t('account.changePassword')}</Button>
          <p className="text-sm text-stone-600">{t('account.passwordChanged')}</p>
        </form>
      </Section>

      <Section title={t('account.yourData')}>
        <p className="text-sm text-stone-700">{t('account.exportHint')}</p>
        <a href="/api/me/export" className="mt-3 inline-flex min-h-[44px] items-center rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 hover:bg-stone-50" download>
          {t('account.export')}
        </a>
      </Section>

      {user.role !== 'admin' && (
        <Section title={t('account.delete')}>
          <p className="text-sm text-stone-700">{t('account.deleteHint')}</p>
          <form
            className="mt-3 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setDelState({ busy: true });
              try {
                await api.post('/api/me/delete', { password: delPw });
                await refresh();
                router.push('/?deleted=1');
              } catch (err) {
                setDelState({ error: errorText(err) });
              }
            }}
          >
            {delState.error && <Alert tone="error">{delState.error}</Alert>}
            <TextField label={t('account.deleteConfirm')} type="password" autoComplete="current-password" value={delPw} required onChange={(e) => setDelPw(e.target.value)} />
            <Button type="submit" variant="danger" loading={delState.busy} disabled={!delPw}>{t('account.delete')}</Button>
          </form>
        </Section>
      )}
    </div>
  );
}

export default function AccountPage() {
  const { t } = useI18n();
  return (
    <RequireRole>
      <div className="container-page max-w-2xl py-8">
        <PageHeader title={t('account.title')} />
        <Account />
      </div>
    </RequireRole>
  );
}
