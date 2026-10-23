'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { Alert, Badge, Button, EmptyState, LinkButton, LoadError, Section, Spinner, TextArea, useApiError, useLoad } from '@/components/ui';
import { JobSummary, usePayText } from '@/components/JobCard';

interface Job extends JobSummary {
  duties: string;
  openings: number;
  applicationMethod: 'in_app' | 'phone' | 'email';
  contactValue: string | null;
  closesOn: string | null;
  isOwner: boolean;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, tk, formatDate } = useI18n();
  const { user } = useSession();
  const pay = usePayText();
  const errorText = useApiError();
  const { data: job, error, loading, reload, setData } = useLoad(() => api.get<{ job: Job }>(`/api/jobs/${id}`).then((r) => r.job), [id, user?.id]);
  const [note, setNote] = useState('');
  const [state, setState] = useState<{ busy?: boolean; error?: string; ok?: boolean }>({});

  if (loading) return <Spinner />;
  if (error || !job)
    return (
      <div className="container-page py-10">
        {(error as any)?.code === 'not_found' ? <EmptyState title={t('jobs.notFound')} action={<LinkButton href="/jobs">{t('nav.jobs')}</LinkButton>} /> : <LoadError error={error} onRetry={reload} />}
      </div>
    );

  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ busy: true });
    try {
      await api.post(`/api/jobs/${job.id}/apply`, { coverNote: note.trim() || undefined });
      setState({ ok: true });
      setData({ ...job, myApplicationStatus: 'submitted' });
    } catch (err) {
      setState({ error: errorText(err) });
    }
  };

  let applyBlock: React.ReactNode;
  if (job.isOwner) applyBlock = <LinkButton href={`/employer/jobs/${job.id}`}>{t('emp.viewApplicants')}</LinkButton>;
  else if (job.applicationMethod !== 'in_app')
    applyBlock = job.contactValue ? (
      <p className="text-stone-900">
        {job.applicationMethod === 'phone' ? (
          <a className="link" href={`tel:${job.contactValue}`}>{t('jobs.applyByPhone', { contact: job.contactValue })}</a>
        ) : (
          <a className="link" href={`mailto:${job.contactValue}`}>{t('jobs.applyByEmail', { contact: job.contactValue })}</a>
        )}
      </p>
    ) : (
      <LinkButton href={`/login?next=/jobs/${job.id}`}>{t('jobs.loginToSeeContact')}</LinkButton>
    );
  else if (job.myApplicationStatus)
    applyBlock = (
      <div className="space-y-2">
        {state.ok && <Alert tone="success">{t('jobs.appliedMsg')}</Alert>}
        <p className="text-stone-800">
          {t('jobs.applied')}: <Badge tone="green">{tk('appStatus', job.myApplicationStatus)}</Badge>
        </p>
        <Link href="/worker/applications" className="link text-sm">{t('nav.applications')}</Link>
      </div>
    );
  else if (!user) applyBlock = <LinkButton href={`/login?next=/jobs/${job.id}`}>{t('jobs.loginToApply')}</LinkButton>;
  else if (user.role !== 'worker') applyBlock = <p className="text-stone-700">{t('jobs.needWorkerProfile')}</p>;
  else
    applyBlock = (
      <form onSubmit={apply} className="space-y-3">
        {state.error && <Alert tone="error">{state.error}</Alert>}
        <TextArea label={t('jobs.coverNote')} hint={t('jobs.coverHint')} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
        <Button type="submit" loading={state.busy} className="w-full">{state.busy ? t('jobs.applying') : t('jobs.apply')}</Button>
      </form>
    );

  return (
    <div className="container-page py-8">
      <Link href="/jobs" className="link text-sm">← {t('nav.jobs')}</Link>
      <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">{job.title}</h1>
            <p className="text-stone-700">{job.organisationName}</p>
            <p className="mt-1 flex items-center gap-1 text-sm text-stone-600">
              <MapPin className="h-4 w-4" aria-hidden />
              {job.locality}, {job.city}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge>{tk('employment', job.employmentType)}</Badge>
              {job.trade && <Badge>{tk('cat', job.trade)}</Badge>}
              {job.isDemo && <Badge tone="amber">{t('common.demoListing')}</Badge>}
              {job.status && job.status !== 'open' && <Badge tone="neutral">{tk('emp.status', job.status)}</Badge>}
            </div>
          </div>
          <Section title={t('jobs.duties')}>
            <p className="whitespace-pre-wrap break-words text-stone-900">{job.duties}</p>
          </Section>
          <Section>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="font-semibold text-stone-700">{t('jobs.pay')}</dt><dd className="text-stone-900">{pay(job)}</dd></div>
              <div><dt className="font-semibold text-stone-700">{t('jobs.schedule')}</dt><dd className="text-stone-900">{job.schedule}</dd></div>
              <div><dt className="font-semibold text-stone-700">{t('emp.openings')}</dt><dd className="text-stone-900">{t('jobs.openings', { n: job.openings })}</dd></div>
              {job.closesOn && <div><dt className="font-semibold text-stone-700">{t('emp.closesOn')}</dt><dd className="text-stone-900">{t('jobs.closes', { date: formatDate(job.closesOn) })}</dd></div>}
              {job.requiredSkills.length > 0 && (
                <div className="sm:col-span-2">
                  <dt className="font-semibold text-stone-700">{t('jobs.requirements')}</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">{job.requiredSkills.map((s) => <span key={s} className="rounded-md bg-stone-100 px-2 py-1 text-stone-800">{s}</span>)}</dd>
                </div>
              )}
            </dl>
          </Section>
        </div>
        <aside>
          <Section title={t('jobs.howToApply')} className="lg:sticky lg:top-20">{applyBlock}</Section>
        </aside>
      </div>
    </div>
  );
}
