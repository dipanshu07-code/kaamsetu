'use client';

import Link from 'next/link';
import { Bookmark, BookmarkCheck, MapPin } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Badge } from './ui';

export interface JobSummary {
  id: string;
  title: string;
  organisationName: string;
  locality: string;
  city: string;
  employmentType: string;
  trade: string | null;
  payMin: number | null;
  payMax: number | null;
  payPeriod: string;
  schedule: string;
  requiredSkills: string[];
  distanceKm: number | null;
  saved: boolean;
  isDemo: boolean;
  myApplicationStatus: string | null;
  status?: string;
  applicationCount?: number;
}

export function usePayText() {
  const { t, tk } = useI18n();
  const fmt = (n: number) => n.toLocaleString('en-IN');
  return (j: Pick<JobSummary, 'payMin' | 'payMax' | 'payPeriod'>) => {
    const period = tk('period', j.payPeriod);
    if (j.payMin && j.payMax) return t('jobs.payRange', { min: fmt(j.payMin), max: fmt(j.payMax), period });
    if (j.payMin) return t('jobs.payFrom', { min: fmt(j.payMin), period });
    if (j.payMax) return t('jobs.payUpTo', { max: fmt(j.payMax), period });
    return t('jobs.payNotGiven');
  };
}

export default function JobCard({ job, onToggleSave }: { job: JobSummary; onToggleSave?: (j: JobSummary) => void }) {
  const { t, tk } = useI18n();
  const pay = usePayText();
  return (
    <article className="card flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-stone-900">
            <Link href={`/jobs/${job.id}`} className="hover:underline">
              {job.title}
            </Link>
          </h3>
          <p className="text-sm text-stone-700">{job.organisationName}</p>
        </div>
        {onToggleSave && (
          <button
            type="button"
            onClick={() => onToggleSave(job)}
            aria-pressed={job.saved}
            className="flex min-h-[40px] flex-none items-center gap-1 rounded-lg border border-stone-300 px-2 text-sm font-semibold text-stone-800 hover:bg-stone-50"
          >
            {job.saved ? <BookmarkCheck className="h-4 w-4" aria-hidden /> : <Bookmark className="h-4 w-4" aria-hidden />}
            {job.saved ? t('jobs.saved') : t('jobs.save')}
          </button>
        )}
      </div>
      <p className="flex items-center gap-1 text-sm text-stone-600">
        <MapPin className="h-4 w-4 flex-none" aria-hidden />
        {job.locality}, {job.city}
        {job.distanceKm !== null && ` · ${t('common.aboutKm', { n: job.distanceKm })}`}
      </p>
      <p className="font-semibold text-stone-900">{pay(job)}</p>
      <p className="text-sm text-stone-700">{job.schedule}</p>
      <div className="flex flex-wrap gap-1.5">
        <Badge>{tk('employment', job.employmentType)}</Badge>
        {job.trade && <Badge>{tk('cat', job.trade)}</Badge>}
        {job.myApplicationStatus && <Badge tone="green">{tk('appStatus', job.myApplicationStatus)}</Badge>}
        {job.isDemo && <Badge tone="amber">{t('common.demoListing')}</Badge>}
      </div>
    </article>
  );
}
