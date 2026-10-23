'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n, MessageKey } from '@/lib/i18n';
import { istDate, WorkingBlock } from '@/lib/domain';
import { Alert, Button, LoadError, PageHeader, RequireRole, Section, SelectField, Spinner, TextField, useApiError, useLoad } from '@/components/ui';
import { TimeOptions } from '@/components/domain';
import AvailabilityList, { Availability } from '@/components/AvailabilityList';

interface Profile {
  id: string;
  workingHours: WorkingBlock[];
  timeOff: { id: string; start: string; end: string; kind: string; note: string | null }[];
}

const DAYS = [1, 2, 3, 4, 5, 6, 0];

function HoursEditor({ initial, onSaved }: { initial: WorkingBlock[]; onSaved: () => void }) {
  const { t } = useI18n();
  const errorText = useApiError();
  const [blocks, setBlocks] = useState<WorkingBlock[]>(initial);
  const [state, setState] = useState<{ busy?: boolean; error?: string; ok?: boolean }>({});
  useEffect(() => setBlocks(initial), [initial]);

  const update = (i: number, patch: Partial<WorkingBlock>) => setBlocks(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const save = async () => {
    for (const b of blocks) if (b.endMinute <= b.startMinute) return setState({ error: t('errors.invalid_range') });
    setState({ busy: true });
    try {
      await api.put('/api/worker/hours', { blocks });
      setState({ ok: true });
      onSaved();
    } catch (e) {
      setState({ error: errorText(e) });
    }
  };

  return (
    <Section title={t('schedule.weekly')}>
      <p className="mb-4 text-sm text-stone-600">{t('schedule.weeklyHint')}</p>
      {state.error && <Alert tone="error" className="mb-3">{state.error}</Alert>}
      {state.ok && <Alert tone="success" className="mb-3" onClose={() => setState({})}>{t('common.saved')}</Alert>}
      <div className="divide-y divide-stone-200 rounded-lg border border-stone-200">
        {DAYS.map((wd) => {
          const dayBlocks = blocks.map((b, i) => ({ b, i })).filter((x) => x.b.weekday === wd);
          return (
            <div key={wd} className="grid gap-2 p-3 sm:grid-cols-[120px_1fr]">
              <p className="pt-2 font-semibold text-stone-900">{t(`day.${wd}` as MessageKey)}</p>
              <div className="space-y-2">
                {dayBlocks.length === 0 && <p className="pt-2 text-sm text-stone-600">{t('schedule.dayOff')}</p>}
                {dayBlocks.map(({ b, i }) => (
                  <div key={i} className="flex flex-wrap items-end gap-2">
                    <SelectField label={t('schedule.from')} className="w-36" value={b.startMinute} onChange={(e) => update(i, { startMinute: Number(e.target.value) })}>
                      <TimeOptions />
                    </SelectField>
                    <SelectField label={t('schedule.to')} className="w-36" value={b.endMinute} onChange={(e) => update(i, { endMinute: Number(e.target.value) })}>
                      <TimeOptions />
                    </SelectField>
                    <Button variant="ghost" onClick={() => setBlocks(blocks.filter((_, j) => j !== i))} aria-label={`${t('common.remove')} ${t(`day.${wd}` as MessageKey)}`}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                ))}
                {dayBlocks.length < 3 && (
                  <Button
                    variant="secondary"
                    className="min-h-[36px] text-xs"
                    onClick={() => {
                      const last = dayBlocks[dayBlocks.length - 1]?.b;
                      const start = last ? Math.min(last.endMinute + 60, 20 * 60) : 9 * 60;
                      setBlocks([...blocks, { weekday: wd, startMinute: start, endMinute: Math.min(start + 4 * 60, 21 * 60) }]);
                    }}
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    {t('schedule.addBlock')}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Button className="mt-4" loading={state.busy} onClick={save}>
        {t('schedule.saveHours')}
      </Button>
    </Section>
  );
}

function TimeOff({ items, onChanged }: { items: Profile['timeOff']; onChanged: () => void }) {
  const { t, tk, formatDateTime } = useI18n();
  const errorText = useApiError();
  const today = istDate(new Date());
  const [f, setF] = useState({ start: `${today}T13:00`, end: `${today}T14:00`, kind: 'blocked', note: '' });
  const [state, setState] = useState<{ busy?: boolean; error?: string }>({});
  const toIso = (v: string) => new Date(`${v}:00+05:30`).toISOString();
  return (
    <Section title={t('schedule.blocked')}>
      <p className="mb-4 text-sm text-stone-600">{t('schedule.blockedHint')}</p>
      {items.length === 0 ? (
        <p className="mb-4 text-stone-700">{t('schedule.noBlocked')}</p>
      ) : (
        <ul className="mb-4 divide-y divide-stone-200 rounded-lg border border-stone-200">
          {items.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
              <span>
                <span className="font-semibold text-stone-900">{tk('schedule.kind', x.kind)}</span>: {formatDateTime(x.start)} – {formatDateTime(x.end)}
                {x.note && <span className="block text-stone-600">{x.note}</span>}
              </span>
              <Button
                variant="ghost"
                aria-label={t('common.remove')}
                onClick={async () => {
                  try {
                    await api.del(`/api/worker/time-off/${x.id}`);
                    onChanged();
                  } catch (e) {
                    setState({ error: errorText(e) });
                  }
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setState({ busy: true });
          try {
            await api.post('/api/worker/time-off', { start: toIso(f.start), end: toIso(f.end), kind: f.kind, note: f.note || undefined });
            setState({});
            onChanged();
          } catch (err) {
            setState({ error: errorText(err) });
          }
        }}
      >
        {state.error && <Alert tone="error">{state.error}</Alert>}
        <div className="grid gap-3 sm:grid-cols-3">
          <TextField label={t('schedule.blockStart')} type="datetime-local" value={f.start} required onChange={(e) => setF({ ...f, start: e.target.value })} />
          <TextField label={t('schedule.blockEnd')} type="datetime-local" value={f.end} required onChange={(e) => setF({ ...f, end: e.target.value })} />
          <SelectField label={t('schedule.blockKind')} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
            <option value="blocked">{t('schedule.kind.blocked')}</option>
            <option value="break">{t('schedule.kind.break')}</option>
            <option value="time_off">{t('schedule.kind.time_off')}</option>
          </SelectField>
        </div>
        <TextField label={t('schedule.blockNote')} value={f.note} maxLength={200} optional onChange={(e) => setF({ ...f, note: e.target.value })} />
        <Button type="submit" variant="secondary" loading={state.busy}>
          {t('schedule.addBlocked')}
        </Button>
      </form>
    </Section>
  );
}

function Schedule() {
  const { t } = useI18n();
  const welcome = useSearchParams().get('welcome');
  const { data, error, loading, reload } = useLoad(async () => {
    const { profile } = await api.get<{ profile: Profile }>('/api/worker/profile');
    const availability = await api.get<Availability>(`/api/workers/${profile.id}/availability?days=7`);
    return { profile, availability };
  }, []);
  if (loading && !data) return <Spinner />;
  if (error || !data) return <LoadError error={error} onRetry={reload} />;
  return (
    <div className="space-y-6">
      {welcome && data.profile.workingHours.length === 0 && <Alert tone="info" title={t('notif.welcome')}>{t('wd.profileIncomplete')}</Alert>}
      <HoursEditor initial={data.profile.workingHours} onSaved={reload} />
      <TimeOff items={data.profile.timeOff} onChanged={reload} />
      <Section title={t('schedule.calendar')}>
        <AvailabilityList data={data.availability} />
        <p className="mt-2 text-sm text-stone-600">{t('profile.availabilityHint')}</p>
      </Section>
    </div>
  );
}

export default function SchedulePage() {
  const { t } = useI18n();
  return (
    <RequireRole roles={['worker']}>
      <div className="container-page max-w-4xl py-8">
        <PageHeader title={t('schedule.title')} subtitle={t('schedule.subtitle')} />
        <Suspense>
          <Schedule />
        </Suspense>
      </div>
    </RequireRole>
  );
}
