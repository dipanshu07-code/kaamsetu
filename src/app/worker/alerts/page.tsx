'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BellOff, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { distanceLabel } from '@/components/WorkerCard';
import { useI18n } from '@/lib/i18n';
import { Alert, Badge, Button, EmptyState, LinkButton, LoadError, PageHeader, RequireRole, SelectField, Spinner, TextField, useApiError, useLoad } from '@/components/ui';

interface AlertRow {
  matchId: string;
  matchStatus: 'notified' | 'interested' | 'declined' | 'selected' | 'not_selected';
  distanceKm: number | null;
  quote: { priceType: string; amount: number } | null;
  conversationId: string | null;
  request: { id: string; requestNumber: string; category: string; problem: string; locality: string; city: string; start: string; end: string; priceType: string | null; bookingId: string | null; status: string };
}

function ReplyForm({ a, onDone }: { a: AlertRow; onDone: () => void }) {
  const { t } = useI18n();
  const errorText = useApiError();
  const [priceType, setPriceType] = useState(a.request.priceType || 'visit');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const send = async (decision: 'interested' | 'declined') => {
    setBusy(decision);
    setErr(null);
    try {
      await api.post(`/api/worker/alerts/${a.matchId}`, {
        decision,
        quotePriceType: decision === 'interested' && amount ? priceType : undefined,
        quoteAmount: decision === 'interested' && amount ? Number(amount) : undefined,
        note: decision === 'interested' && note.trim() ? note.trim() : undefined,
      });
      onDone();
    } catch (e) {
      setErr(errorText(e));
      setBusy(null);
    }
  };
  return (
    <form className="mt-3 space-y-3 border-t border-stone-200 pt-3" onSubmit={(e) => { e.preventDefault(); send('interested'); }}>
      {err && <Alert tone="error">{err}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label={t('alerts.quoteType')} value={priceType} onChange={(e) => setPriceType(e.target.value)}>
          <option value="visit">{t('price.visit')}</option>
          <option value="hourly">{t('price.hourly')}</option>
          <option value="fixed">{t('price.fixed')}</option>
        </SelectField>
        <TextField label={t('alerts.quoteAmount')} type="number" min={1} inputMode="numeric" value={amount} optional onChange={(e) => setAmount(e.target.value)} />
      </div>
      <p className="text-sm text-stone-600">{t('alerts.quoteHint')}</p>
      <TextField label={t('alerts.note')} value={note} maxLength={500} optional onChange={(e) => setNote(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={busy === 'interested'} disabled={!!busy}>{t('alerts.interested')}</Button>
        <Button variant="secondary" loading={busy === 'declined'} disabled={!!busy} onClick={() => send('declined')}>{t('alerts.decline')}</Button>
      </div>
    </form>
  );
}

function Alerts() {
  const { t, tk, formatDateTime, formatTime, formatMoney } = useI18n();
  const { data, error, loading, reload } = useLoad(() => api.get<{ alerts: AlertRow[] }>('/api/worker/alerts').then((r) => r.alerts), []);
  if (loading) return <Spinner />;
  if (error) return <LoadError error={error} onRetry={reload} />;
  if (!data?.length)
    return <EmptyState icon={BellOff} title={t('alerts.empty')} action={<LinkButton href="/worker/schedule" variant="secondary">{t('nav.schedule')}</LinkButton>} />;
  return (
    <ul className="space-y-3">
      {data.map((a) => (
        <li key={a.matchId} className="card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-stone-900">{tk('cat', a.request.category)}</p>
              <p className="text-sm text-stone-700">{formatDateTime(a.request.start)} – {formatTime(a.request.end)}</p>
              <p className="flex items-center gap-1 text-sm text-stone-600">
                <MapPin className="h-4 w-4" aria-hidden />
                {a.request.locality}, {a.request.city}
                {a.distanceKm !== null && ` · ${distanceLabel(t, a.distanceKm)}`}
              </p>
            </div>
            {a.matchStatus === 'notified' && <Badge tone="orange">{t('common.newBadge')}</Badge>}
          </div>
          <p className="mt-2 whitespace-pre-wrap break-words text-stone-900">{a.request.problem}</p>
          <p className="mt-1 text-xs text-stone-500">{t('alerts.addressHidden')}</p>
          {a.matchStatus === 'notified' && <ReplyForm a={a} onDone={reload} />}
          {a.matchStatus === 'interested' && (
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-stone-200 pt-3 text-sm">
              <span className="text-stone-700">
                {t('alerts.youReplied')}
                {a.quote && ` (${formatMoney(a.quote.amount)} · ${tk('price', a.quote.priceType)})`}
              </span>
              {a.conversationId && <Link href={`/messages/${a.conversationId}`} className="link">{t('request.chat')}</Link>}
            </div>
          )}
          {a.matchStatus === 'declined' && <p className="mt-3 border-t border-stone-200 pt-3 text-sm text-stone-600">{t('alerts.youDeclined')}</p>}
          {a.matchStatus === 'selected' && a.request.bookingId && (
            <div className="mt-3 border-t border-stone-200 pt-3">
              <Alert tone="success">{t('alerts.selected')}</Alert>
              <LinkButton href={`/bookings/${a.request.bookingId}`} className="mt-2">{t('booking.open')}</LinkButton>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function AlertsPage() {
  const { t } = useI18n();
  return (
    <RequireRole roles={['worker']}>
      <div className="container-page max-w-3xl py-8">
        <PageHeader title={t('alerts.title')} subtitle={t('alerts.subtitle')} />
        <Alerts />
      </div>
    </RequireRole>
  );
}
