'use client';

import React, { useState } from 'react';
import { CheckCircle2, CircleDashed, Hourglass, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n, MessageKey } from '@/lib/i18n';
import { Alert, Badge, Button, Checkbox, LoadError, PageHeader, RequireRole, Section, Spinner, TextField, useApiError, useLoad } from '@/components/ui';

interface Check { id: string; type: string; slot: number; status: string; expiresAt: string | null }
interface Verification {
  category: string;
  provider: { configured: boolean };
  policy: { required: { type: string; slot: number; validMonths?: number }[]; optional: string[] };
  eligible: boolean;
  onHold: boolean;
  checks: Check[];
}

const STATUS_ICON: Record<string, { icon: any; tone: 'green' | 'amber' | 'red' | 'neutral' }> = {
  passed: { icon: CheckCircle2, tone: 'green' },
  pending: { icon: Hourglass, tone: 'amber' },
  failed: { icon: XCircle, tone: 'red' },
  expired: { icon: CircleDashed, tone: 'neutral' },
  not_started: { icon: CircleDashed, tone: 'neutral' },
};

function CheckRow({ type, slot, check, multi, onRequested }: { type: string; slot: number; check?: Check; multi: boolean; onRequested: (v: Verification) => void }) {
  const { t, tk, formatDate } = useI18n();
  const errorText = useApiError();
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [ref, setRef] = useState({ name: '', relation: '', phone: '' });
  const [note, setNote] = useState('');
  const [state, setState] = useState<{ busy?: boolean; error?: string }>({});
  const status = check?.status || 'not_started';
  const s = STATUS_ICON[status];
  const canRequest = ['not_started', 'failed', 'expired'].includes(status);
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-stone-900">
            {tk('check', type)}
            {multi && ` ${t('verify.slot', { n: slot })}`}
          </p>
          <p className="text-sm text-stone-600">{t(`checkHelp.${type}` as MessageKey)}</p>
          {check?.expiresAt && status === 'passed' && <p className="text-sm text-stone-600">{t('verify.expires', { date: formatDate(check.expiresAt) })}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={s.tone} icon={s.icon}>{tk('checkStatus', status)}</Badge>
          {canRequest && !open && <Button variant="secondary" className="min-h-[36px]" onClick={() => setOpen(true)}>{t('verify.request')}</Button>}
        </div>
      </div>
      {open && (
        <form
          className="mt-3 space-y-3 rounded-lg bg-stone-50 p-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!consent) return setState({ error: t('validation.accept_privacy') });
            setState({ busy: true });
            try {
              const v = await api.post<Verification>('/api/worker/verification', {
                type,
                slot,
                consent: true,
                note: note.trim() || undefined,
                reference: type === 'reference' ? ref : undefined,
              });
              setOpen(false);
              setState({});
              onRequested(v);
            } catch (err) {
              setState({ error: errorText(err) });
            }
          }}
        >
          {state.error && <Alert tone="error">{state.error}</Alert>}
          {type === 'reference' && (
            <>
              <p className="text-sm font-semibold text-stone-800">{t('verify.reference')}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <TextField label={t('verify.refName')} value={ref.name} required maxLength={120} onChange={(e) => setRef({ ...ref, name: e.target.value })} />
                <TextField label={t('verify.refRelation')} value={ref.relation} required maxLength={80} onChange={(e) => setRef({ ...ref, relation: e.target.value })} />
                <TextField label={t('verify.refPhone')} type="tel" inputMode="numeric" value={ref.phone} required onChange={(e) => setRef({ ...ref, phone: e.target.value })} />
              </div>
              <p className="text-sm text-stone-600">{t('verify.refPrivacy')}</p>
            </>
          )}
          <TextField label={t('verify.note')} value={note} maxLength={500} optional onChange={(e) => setNote(e.target.value)} />
          <Checkbox label={t('verify.consent')} checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <div className="flex gap-2">
            <Button type="submit" loading={state.busy}>{t('verify.request')}</Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
          </div>
        </form>
      )}
    </li>
  );
}

function VerificationView() {
  const { t, tk } = useI18n();
  const { data, error, loading, reload, setData } = useLoad(() => api.get<Verification>('/api/worker/verification'), []);
  if (loading && !data) return <Spinner />;
  if (error || !data) return <LoadError error={error} onRetry={reload} />;
  const find = (type: string, slot: number) => data.checks.find((c) => c.type === type && c.slot === slot);
  const requiredTypes = data.policy.required;
  const optional = Array.from(new Set([...data.policy.optional, 'phone', 'skill'])).filter((x) => !requiredTypes.some((r) => r.type === x));
  const category = tk('cat', data.category);
  return (
    <div className="space-y-6">
      {!data.provider.configured && <Alert tone="info">{t('verify.providerMissing')}</Alert>}
      {data.onHold && <Alert tone="warning">{t('verify.onHold')}</Alert>}
      {requiredTypes.length > 0 && (
        <Section title={t('verify.requiredFor', { category })}>
          <Alert tone={data.eligible ? 'success' : 'warning'} className="mb-2">
            {data.eligible ? t('verify.eligible', { category }) : t('verify.notEligible', { category })}
          </Alert>
          <ul className="divide-y divide-stone-200">
            {requiredTypes.map((r) => (
              <CheckRow key={`${r.type}-${r.slot}`} type={r.type} slot={r.slot} check={find(r.type, r.slot)} multi={requiredTypes.filter((x) => x.type === r.type).length > 1} onRequested={setData} />
            ))}
          </ul>
        </Section>
      )}
      <Section title={t('verify.optional')}>
        <ul className="divide-y divide-stone-200">
          {optional.map((type) => (
            <CheckRow key={type} type={type} slot={1} check={find(type, 1)} multi={false} onRequested={setData} />
          ))}
        </ul>
        <p className="mt-3 text-sm text-stone-600">{t('profile.checksDisclaimer')}</p>
      </Section>
    </div>
  );
}

export default function VerificationPage() {
  const { t } = useI18n();
  return (
    <RequireRole roles={['worker']}>
      <div className="container-page max-w-3xl py-8">
        <PageHeader title={t('verify.title')} subtitle={t('verify.subtitle')} />
        <VerificationView />
      </div>
    </RequireRole>
  );
}
