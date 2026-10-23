'use client';

import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Badge, Button, EmptyState, LinkButton, LoadError, PageHeader, RequireRole, Spinner, useLoad } from '@/components/ui';

interface Application {
  id: string;
  status: string;
  appliedAt: string;
  conversationId: string | null;
  job: { id: string; title: string; organisationName: string; locality: string; city: string; employmentType: string; status: string };
}

function Applications() {
  const { t, tk, formatDate } = useI18n();
  const { data, error, loading, reload } = useLoad(() => api.get<{ applications: Application[] }>('/api/applications').then((r) => r.applications), []);
  if (loading) return <Spinner />;
  if (error) return <LoadError error={error} onRetry={reload} />;
  if (!data?.length) return <EmptyState icon={Briefcase} title={t('apps.empty')} action={<LinkButton href="/jobs">{t('home.findJobCta')}</LinkButton>} />;
  return (
    <ul className="space-y-3">
      {data.map((a) => (
        <li key={a.id} className="card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <Link href={`/jobs/${a.job.id}`} className="font-semibold text-stone-900 hover:underline">{a.job.title}</Link>
              <p className="text-sm text-stone-700">{a.job.organisationName} · {a.job.locality}, {a.job.city}</p>
              <p className="text-sm text-stone-600">{tk('employment', a.job.employmentType)} · {formatDate(a.appliedAt)}</p>
            </div>
            <Badge tone={a.status === 'hired' || a.status === 'offered' ? 'green' : a.status === 'rejected' || a.status === 'withdrawn' ? 'neutral' : 'orange'}>{tk('appStatus', a.status)}</Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {a.conversationId && <LinkButton href={`/messages/${a.conversationId}`} variant="secondary">{t('request.chat')}</LinkButton>}
            {!['hired', 'rejected', 'withdrawn'].includes(a.status) && (
              <Button
                variant="ghost"
                onClick={async () => {
                  if (!window.confirm(t('apps.withdrawConfirm'))) return;
                  await api.post(`/api/applications/${a.id}/withdraw`).catch(() => undefined);
                  reload();
                }}
              >
                {t('apps.withdraw')}
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function ApplicationsPage() {
  const { t } = useI18n();
  return (
    <RequireRole roles={['worker']}>
      <div className="container-page max-w-3xl py-8">
        <PageHeader title={t('apps.title')} />
        <Applications />
      </div>
    </RequireRole>
  );
}
