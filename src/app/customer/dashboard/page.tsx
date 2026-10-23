'use client';

import Link from 'next/link';
import { CalendarDays, ClipboardList } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { Badge, EmptyState, LinkButton, LoadError, PageHeader, RequireRole, Section, Spinner, useLoad } from '@/components/ui';
import BookingList, { ACTIVE, BookingRow } from '@/components/BookingList';

interface RequestRow {
  id: string;
  requestNumber: string;
  category: string;
  locality: string;
  start: string;
  status: string;
  alerted: number;
  interested: number;
  bookingId: string | null;
}

function Dashboard() {
  const { t, tk, formatDateTime } = useI18n();
  const { user } = useSession();
  const { data, error, loading, reload } = useLoad(async () => {
    const [b, r] = await Promise.all([api.get<{ bookings: BookingRow[] }>('/api/bookings'), api.get<{ requests: RequestRow[] }>('/api/requests')]);
    return { bookings: b.bookings, requests: r.requests };
  }, []);

  if (loading) return <Spinner />;
  if (error || !data) return <div className="container-page py-10"><LoadError error={error} onRetry={reload} /></div>;

  const active = data.bookings.filter((b) => ACTIVE.includes(b.status)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = data.bookings.filter((b) => !ACTIVE.includes(b.status));
  const openRequests = data.requests.filter((r) => r.status === 'open');

  return (
    <div className="container-page py-8">
      <PageHeader
        title={t('cust.hello', { name: user?.name.split(' ')[0] || '' })}
        actions={
          <>
            <LinkButton href="/requests/new">{t('cust.newRequest')}</LinkButton>
            <LinkButton href="/workers" variant="secondary">{t('cust.findWorker')}</LinkButton>
          </>
        }
      />
      <div className="space-y-6">
        {openRequests.length > 0 && (
          <Section title={t('cust.activeRequests')}>
            <ul className="divide-y divide-stone-200">
              {openRequests.map((r) => (
                <li key={r.id}>
                  <Link href={`/requests/${r.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:underline">
                    <span>
                      <span className="font-semibold text-stone-900">{tk('cat', r.category)}</span>
                      <span className="block text-sm text-stone-600">{r.locality} · {formatDateTime(r.start)}</span>
                    </span>
                    <Badge tone={r.interested ? 'green' : 'neutral'}>
                      {r.interested ? t('request.repliesCount', { n: r.interested }) : t('request.noRepliesYet')}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <section>
          <h2 className="mb-3 text-lg font-semibold text-stone-900">{t('booking.upcoming')}</h2>
          {active.length === 0 ? (
            <EmptyState icon={CalendarDays} title={t('cust.noActive')} text={t('cust.noActiveHint')} action={<LinkButton href="/requests/new">{t('cust.newRequest')}</LinkButton>} />
          ) : (
            <BookingList bookings={active} as="customer" />
          )}
        </section>

        {past.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-stone-900">{t('booking.past')}</h2>
            <BookingList bookings={past} as="customer" />
          </section>
        )}

        {data.requests.filter((r) => r.status !== 'open').length > 0 && (
          <Section title={t('request.listTitle')}>
            <ul className="divide-y divide-stone-200">
              {data.requests
                .filter((r) => r.status !== 'open')
                .map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <Link href={`/requests/${r.id}`} className="link">
                      {tk('cat', r.category)} · {formatDateTime(r.start)}
                    </Link>
                    <Badge>{tk('request.status', r.status)}</Badge>
                  </li>
                ))}
            </ul>
          </Section>
        )}

        <p className="flex items-center gap-2 text-sm text-stone-700">
          <ClipboardList className="h-4 w-4" aria-hidden />
          <Link href="/grievance" className="link">
            {t('nav.grievance')}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function CustomerDashboardPage() {
  return (
    <RequireRole roles={['customer']}>
      <Dashboard />
    </RequireRole>
  );
}
