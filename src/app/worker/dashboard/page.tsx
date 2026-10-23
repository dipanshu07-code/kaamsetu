'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BellRing, Briefcase, CalendarDays, Inbox } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Alert, EmptyState, LinkButton, LoadError, PageHeader, RequireRole, Section, Spinner, useApiError, useLoad } from '@/components/ui';
import BookingList, { BookingRow } from '@/components/BookingList';
import { cn } from '@/lib/utils';

interface Profile {
  id: string;
  fullName: string;
  isAvailableToday: boolean;
  workingHours: unknown[];
  acceptsOnDemand: boolean;
  openToJobs: boolean;
}

function Dashboard() {
  const { t, tk, formatMoney } = useI18n();
  const errorText = useApiError();
  const [toggleError, setToggleError] = useState<string | null>(null);
  const { data, error, loading, reload, setData } = useLoad(async () => {
    const [p, b, a, j] = await Promise.all([
      api.get<{ profile: Profile }>('/api/worker/profile'),
      api.get<{ bookings: BookingRow[] }>('/api/bookings'),
      api.get<{ alerts: { matchStatus: string }[] }>('/api/worker/alerts'),
      api.get<{ jobs: { id: string; title: string; organisationName: string; locality: string; employmentType: string; payMin: number | null; payMax: number | null; payPeriod: string }[] }>('/api/worker/jobs'),
    ]);
    return { profile: p.profile, bookings: b.bookings, alerts: a.alerts, jobs: j.jobs };
  }, []);

  if (loading) return <Spinner />;
  if (error || !data) return <div className="container-page py-10"><LoadError error={error} onRetry={reload} /></div>;

  const pending = data.bookings.filter((b) => b.status === 'pending');
  const upcoming = data.bookings.filter((b) => ['accepted', 'confirmed', 'in_progress'].includes(b.status)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = data.bookings.filter((b) => !['pending', 'accepted', 'confirmed', 'in_progress'].includes(b.status)).slice(0, 10);
  const newAlerts = data.alerts.filter((a) => a.matchStatus === 'notified').length;
  const on = data.profile.isAvailableToday;

  const toggle = async () => {
    setToggleError(null);
    try {
      const { profile } = await api.patch<{ profile: Profile }>('/api/worker/profile', { isAvailableToday: !on });
      setData({ ...data, profile });
    } catch (e) {
      setToggleError(errorText(e));
    }
  };

  return (
    <div className="container-page py-8">
      <PageHeader
        title={t('wd.title')}
        subtitle={data.profile.fullName}
        actions={<LinkButton href={`/workers/${data.profile.id}`} variant="secondary">{t('wp.viewPublic')}</LinkButton>}
      />
      <div className="space-y-6">
        <section className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-stone-900">{on ? t('wd.takingWork') : t('wd.notTakingWork')}</p>
            <p className="text-sm text-stone-600">{t('wd.toggleHint')}</p>
            {toggleError && <p className="mt-1 text-sm text-red-700">{toggleError}</p>}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            onClick={toggle}
            className={cn('relative h-9 w-16 flex-none rounded-full border-2 transition-colors', on ? 'border-green-700 bg-green-600' : 'border-stone-400 bg-stone-200')}
          >
            <span className="sr-only">{t('wd.takingWork')}</span>
            <span className={cn('absolute top-0.5 h-7 w-7 rounded-full bg-white shadow transition-all', on ? 'left-[30px]' : 'left-0.5')} />
          </button>
        </section>

        {data.profile.workingHours.length === 0 && (
          <Alert tone="warning" title={t('wd.profileIncomplete')}>
            <Link href="/worker/schedule" className="link">{t('wd.setHours')}</Link>
          </Alert>
        )}

        {data.profile.acceptsOnDemand && (
          <Link href="/worker/alerts" className="card flex items-center justify-between gap-3 p-4 hover:border-stone-400">
            <span className="flex items-center gap-3">
              <BellRing className="h-6 w-6 text-brand-800" aria-hidden />
              <span className="font-semibold text-stone-900">{t('wd.alerts')}</span>
            </span>
            <span className="rounded-full bg-brand-700 px-3 py-1 text-sm font-bold text-white">{newAlerts}</span>
          </Link>
        )}

        <section>
          <h2 className="mb-3 text-lg font-semibold text-stone-900">{t('wd.newRequests')}</h2>
          {pending.length ? <BookingList bookings={pending} as="worker" /> : <EmptyState icon={Inbox} title={t('wd.noRequests')} />}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-stone-900">{t('wd.upcoming')}</h2>
          {upcoming.length ? <BookingList bookings={upcoming} as="worker" /> : <EmptyState icon={CalendarDays} title={t('wd.noUpcoming')} action={<LinkButton href="/worker/schedule" variant="secondary">{t('nav.schedule')}</LinkButton>} />}
        </section>

        {data.jobs.length > 0 && (
          <Section title={t('wd.jobsForYou')} actions={<Link href="/jobs" className="link text-sm">{t('common.viewAll')}</Link>}>
            <ul className="divide-y divide-stone-200">
              {data.jobs.slice(0, 4).map((j) => (
                <li key={j.id}>
                  <Link href={`/jobs/${j.id}`} className="flex items-start gap-3 py-3 hover:underline">
                    <Briefcase className="mt-0.5 h-5 w-5 flex-none text-stone-600" aria-hidden />
                    <span>
                      <span className="block font-semibold text-stone-900">{j.title}</span>
                      <span className="block text-sm text-stone-600">
                        {j.organisationName} · {j.locality} · {tk('employment', j.employmentType)}
                        {(j.payMin || j.payMax) && ` · ${formatMoney(j.payMin || j.payMax)}/${tk('period', j.payPeriod)}`}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {past.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-stone-900">{t('booking.past')}</h2>
            <BookingList bookings={past} as="worker" />
          </section>
        )}
      </div>
    </div>
  );
}

export default function WorkerDashboardPage() {
  return (
    <RequireRole roles={['worker']}>
      <Dashboard />
    </RequireRole>
  );
}
