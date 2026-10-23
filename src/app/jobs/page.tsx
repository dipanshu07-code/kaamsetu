'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Briefcase, Search } from 'lucide-react';
import { api, qs } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { Button, Checkbox, EmptyState, LoadError, PageHeader, SelectField, Spinner, TextField, useLoad } from '@/components/ui';
import { LocalityPicker, LocalityValue } from '@/components/domain';
import JobCard, { JobSummary } from '@/components/JobCard';
import { EMPLOYMENT_TYPES } from '@/lib/domain';

function Jobs() {
  const { t, tk } = useI18n();
  const params = useSearchParams();
  const { user } = useSession();
  const { data: cats } = useLoad(() => api.get<{ categories: { slug: string }[] }>('/api/categories'), []);
  const [f, setF] = useState({ q: '', trade: params.get('trade') || '', employmentType: '', minPay: '', maxKm: '', savedOnly: false });
  const [loc, setLoc] = useState<LocalityValue>({ localityId: user?.localityId || null, localityText: '', city: user?.city || '' });
  const [applied, setApplied] = useState(0);
  const query = useMemo(
    () => qs({ q: f.q.trim(), trade: f.trade, employmentType: f.employmentType, minPay: f.minPay, city: loc.city, localityId: loc.localityId || undefined, maxKm: f.maxKm, savedOnly: f.savedOnly }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applied, loc.city, loc.localityId],
  );
  const { data, error, loading, reload, setData } = useLoad(() => api.get<{ jobs: JobSummary[] }>(`/api/jobs${query}`).then((r) => r.jobs), [query]);
  const canSave = user?.role === 'worker';
  const toggleSave = async (j: JobSummary) => {
    try {
      await api.post(`/api/jobs/${j.id}/save`, { save: !j.saved });
      setData((data || []).map((x) => (x.id === j.id ? { ...x, saved: !j.saved } : x)));
    } catch {
      /* the card simply keeps its state */
    }
  };

  return (
    <div className="container-page py-8">
      <PageHeader title={t('jobs.title')} subtitle={t('jobs.subtitle')} />
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <form className="card h-fit space-y-4 p-4" onSubmit={(e) => { e.preventDefault(); setApplied((n) => n + 1); }} aria-label={t('common.filters')}>
          <TextField label={t('jobs.search')} placeholder={t('jobs.searchPlaceholder')} value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
          <LocalityPicker value={loc} onChange={setLoc} allowFreeText={false} />
          <SelectField label={t('workers.distance')} value={f.maxKm} onChange={(e) => setF({ ...f, maxKm: e.target.value })}>
            <option value="">{t('workers.anyDistance')}</option>
            {[5, 10, 20, 40].map((n) => <option key={n} value={n}>{t('workers.withinKm', { n })}</option>)}
          </SelectField>
          <SelectField label={t('jobs.type')} value={f.employmentType} onChange={(e) => setF({ ...f, employmentType: e.target.value })}>
            <option value="">{t('jobs.anyType')}</option>
            {EMPLOYMENT_TYPES.map((x) => <option key={x} value={x}>{tk('employment', x)}</option>)}
          </SelectField>
          <SelectField label={t('jobs.trade')} value={f.trade} onChange={(e) => setF({ ...f, trade: e.target.value })}>
            <option value="">{t('jobs.anyTrade')}</option>
            {(cats?.categories || []).map((c) => <option key={c.slug} value={c.slug}>{tk('cat', c.slug)}</option>)}
          </SelectField>
          <TextField label={t('jobs.minPay')} type="number" min={0} value={f.minPay} optional onChange={(e) => setF({ ...f, minPay: e.target.value })} />
          {canSave && <Checkbox label={t('jobs.savedOnly')} checked={f.savedOnly} onChange={(e) => setF({ ...f, savedOnly: e.target.checked })} />}
          <Button type="submit" className="w-full">
            <Search className="h-4 w-4" aria-hidden />
            {t('common.search')}
          </Button>
          <p className="text-sm text-stone-600">
            {t('jobs.forRepairs')} <Link href="/requests/new" className="link">{t('nav.getRepair')}</Link>
          </p>
        </form>
        <div className="space-y-4">
          {loading && <Spinner />}
          {!!error && <LoadError error={error} onRetry={reload} />}
          {data && !loading && (
            <>
              <p className="text-sm text-stone-700" aria-live="polite">{t('jobs.results', { n: data.length })}</p>
              {data.length === 0 ? (
                <EmptyState icon={Briefcase} title={t('jobs.empty')} />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {data.map((j) => <JobCard key={j.id} job={j} onToggleSave={canSave ? toggleSave : undefined} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense>
      <Jobs />
    </Suspense>
  );
}
