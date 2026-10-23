'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Users } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { APPLICATION_STATUSES } from '@/lib/domain';
import { Alert, Badge, Button, EmptyState, LinkButton, LoadError, PageHeader, RequireRole, SelectField, Spinner, Tabs, TextField, useApiError, useLoad } from '@/components/ui';
import { Avatar, VerificationBadge } from '@/components/domain';
import JobForm, { JobInput } from '@/components/forms/JobForm';
import { JobSummary } from '@/components/JobCard';

interface Applicant {
  id: string;
  status: string;
  coverNote: string | null;
  employerNote: string | null;
  appliedAt: string;
  conversationId: string | null;
  worker: { id: string; fullName: string; avatarUrl: string | null; category: string; experienceYears: number; locality: string; city: string; skills: string[]; headline: string | null; verificationStatus: string; completedJobsCount: number };
}

interface JobFull extends JobSummary {
  duties: string;
  openings: number;
  applicationMethod: 'in_app' | 'phone' | 'email';
  contactValue: string | null;
  closesOn: string | null;
  localityId: string | null;
}

const SETTABLE = APPLICATION_STATUSES.filter((s) => !['submitted', 'withdrawn'].includes(s));

function ApplicantRow({ a, onChanged }: { a: Applicant; onChanged: () => void }) {
  const { t, tk, formatDate } = useI18n();
  const errorText = useApiError();
  const [status, setStatus] = useState(a.status);
  const [note, setNote] = useState(a.employerNote || '');
  const [state, setState] = useState<{ busy?: boolean; error?: string; ok?: boolean }>({});
  return (
    <li className="card p-4">
      <div className="flex items-start gap-3">
        <Avatar src={a.worker.avatarUrl} name={a.worker.fullName} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link href={`/workers/${a.worker.id}`} className="font-semibold text-stone-900 hover:underline">{a.worker.fullName}</Link>
            <Badge tone={a.status === 'withdrawn' || a.status === 'rejected' ? 'neutral' : 'orange'}>{tk('appStatus', a.status)}</Badge>
          </div>
          <p className="text-sm text-stone-700">{tk('cat', a.worker.category)} · {t('common.years', { n: a.worker.experienceYears })} · {a.worker.locality}, {a.worker.city}</p>
          {a.worker.headline && <p className="text-sm text-stone-800">{a.worker.headline}</p>}
          <div className="mt-1 flex flex-wrap gap-1.5"><VerificationBadge status={a.worker.verificationStatus} /></div>
          {a.worker.skills.length > 0 && <p className="mt-1 text-sm text-stone-600">{a.worker.skills.join(', ')}</p>}
          <p className="mt-1 text-xs text-stone-500">{formatDate(a.appliedAt)}</p>
        </div>
      </div>
      {a.coverNote && <p className="mt-3 rounded-lg bg-stone-50 p-3 text-sm text-stone-800">“{a.coverNote}”</p>}
      {a.status !== 'withdrawn' && (
        <form
          className="mt-3 grid gap-3 sm:grid-cols-[200px_1fr_auto] sm:items-end"
          onSubmit={async (e) => {
            e.preventDefault();
            setState({ busy: true });
            try {
              await api.patch(`/api/applications/${a.id}`, { status, employerNote: note.trim() || undefined });
              setState({ ok: true });
              onChanged();
            } catch (err) {
              setState({ error: errorText(err) });
            }
          }}
        >
          <SelectField label={t('emp.setStatus')} value={status} onChange={(e) => setStatus(e.target.value)}>
            {!SETTABLE.includes(status as any) && <option value={status}>{tk('appStatus', status)}</option>}
            {SETTABLE.map((s) => <option key={s} value={s}>{tk('appStatus', s)}</option>)}
          </SelectField>
          <TextField label={t('emp.privateNote')} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
          <Button type="submit" loading={state.busy}>{t('common.save')}</Button>
        </form>
      )}
      {state.error && <Alert tone="error" className="mt-2">{state.error}</Alert>}
      {a.conversationId && (
        <div className="mt-3">
          <LinkButton href={`/messages/${a.conversationId}`} variant="secondary">{t('request.chat')}</LinkButton>
        </div>
      )}
    </li>
  );
}

function JobAdmin() {
  const { id } = useParams<{ id: string }>();
  const published = useSearchParams().get('published');
  const { t } = useI18n();
  const [tab, setTab] = useState<'applicants' | 'edit'>('applicants');
  const [saved, setSaved] = useState(false);
  const { data, error, loading, reload } = useLoad(() => api.get<{ job: JobFull; applications: Applicant[] }>(`/api/jobs/${id}/applications`), [id]);
  if (loading && !data) return <Spinner />;
  if (error || !data) return <LoadError error={error} onRetry={reload} />;
  const j = data.job;
  const initial: JobInput = {
    title: j.title,
    duties: j.duties,
    tradeSlug: j.trade || '',
    employmentType: j.employmentType,
    payMin: j.payMin ? String(j.payMin) : '',
    payMax: j.payMax ? String(j.payMax) : '',
    payPeriod: j.payPeriod,
    schedule: j.schedule,
    openings: String(j.openings),
    requiredSkills: j.requiredSkills.join(', '),
    applicationMethod: j.applicationMethod,
    contactValue: j.contactValue || '',
    closesOn: j.closesOn || '',
  };
  return (
    <>
      <Link href="/employer/dashboard" className="link text-sm">← {t('emp.title')}</Link>
      <div className="mt-3">
        <PageHeader title={j.title} subtitle={`${j.locality}, ${j.city}`} actions={<LinkButton href={`/jobs/${j.id}`} variant="secondary">{t('chat.viewContext')}</LinkButton>} />
      </div>
      {published && <Alert tone="success" className="mb-4">{t('emp.published')}</Alert>}
      {saved && <Alert tone="success" className="mb-4" onClose={() => setSaved(false)}>{t('common.saved')}</Alert>}
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'applicants', label: t('emp.applicants', { n: data.applications.length }) },
          { id: 'edit', label: t('emp.editTitle') },
        ]}
      />
      {tab === 'applicants' ? (
        data.applications.length === 0 ? (
          <EmptyState icon={Users} title={t('emp.noApplicants')} />
        ) : (
          <ul className="space-y-3">
            {data.applications.map((a) => <ApplicantRow key={a.id} a={a} onChanged={reload} />)}
          </ul>
        )
      ) : (
        <JobForm
          jobId={j.id}
          initial={initial}
          initialLocation={{ localityId: j.localityId, localityText: j.locality, city: j.city }}
          onSaved={() => {
            setSaved(true);
            setTab('applicants');
            reload();
          }}
        />
      )}
    </>
  );
}

export default function EmployerJobPage() {
  return (
    <RequireRole roles={['employer', 'admin']}>
      <div className="container-page max-w-4xl py-8">
        <Suspense>
          <JobAdmin />
        </Suspense>
      </div>
    </RequireRole>
  );
}
