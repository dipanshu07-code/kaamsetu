'use client';

import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { Badge, Button, EmptyState, LinkButton, LoadError, PageHeader, RequireRole, Spinner, useLoad } from '@/components/ui';
import { JobSummary, usePayText } from '@/components/JobCard';

function Dashboard() {
  const { t, tk } = useI18n();
  const { user } = useSession();
  const pay = usePayText();
  const { data, error, loading, reload } = useLoad(() => api.get<{ jobs: JobSummary[] }>('/api/employer/jobs').then((r) => r.jobs), []);
  const setStatus = async (id: string, status: string) => {
    await api.patch(`/api/jobs/${id}`, { status }).catch(() => undefined);
    reload();
  };
  return (
    <>
      <PageHeader title={t('emp.title')} subtitle={user?.organisationName || undefined} actions={<LinkButton href="/employer/jobs/new">{t('emp.post')}</LinkButton>} />
      {loading ? (
        <Spinner />
      ) : error ? (
        <LoadError error={error} onRetry={reload} />
      ) : !data?.length ? (
        <EmptyState icon={Briefcase} title={t('emp.empty')} action={<LinkButton href="/employer/jobs/new">{t('emp.post')}</LinkButton>} />
      ) : (
        <ul className="space-y-3">
          {data.map((j) => (
            <li key={j.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link href={`/employer/jobs/${j.id}`} className="font-semibold text-stone-900 hover:underline">{j.title}</Link>
                  <p className="text-sm text-stone-700">{j.locality}, {j.city} · {tk('employment', j.employmentType)}</p>
                  <p className="text-sm text-stone-600">{pay(j)}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone={j.status === 'open' ? 'green' : 'neutral'}>{tk('emp.status', j.status)}</Badge>
                  {j.isDemo && <Badge tone="amber">{t('common.demoListing')}</Badge>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <LinkButton href={`/employer/jobs/${j.id}`}>{t('emp.applicants', { n: j.applicationCount ?? 0 })}</LinkButton>
                {j.status === 'open' && <Button variant="secondary" onClick={() => setStatus(j.id, 'paused')}>{t('emp.pause')}</Button>}
                {j.status !== 'open' && <Button variant="secondary" onClick={() => setStatus(j.id, 'open')}>{t('emp.reopen')}</Button>}
                {j.status !== 'closed' && <Button variant="ghost" onClick={() => setStatus(j.id, 'closed')}>{t('emp.close')}</Button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function EmployerDashboardPage() {
  return (
    <RequireRole roles={['employer']}>
      <div className="container-page max-w-4xl py-8">
        <Dashboard />
      </div>
    </RequireRole>
  );
}
