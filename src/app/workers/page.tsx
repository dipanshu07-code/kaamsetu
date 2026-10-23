'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Users } from 'lucide-react';
import { api, qs } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { Button, Checkbox, EmptyState, LinkButton, LoadError, PageHeader, SelectField, Spinner, TextField, useLoad } from '@/components/ui';
import { LocalityPicker, LocalityValue, SlotPicker, SlotValue, defaultSlot, UseMyLocation } from '@/components/domain';
import WorkerCard, { WorkerSummary } from '@/components/WorkerCard';
import PriceIntelligenceCard from '@/components/PriceIntelligenceCard';

interface Filters {
  category: string;
  q: string;
  maxKm: string;
  priceType: string;
  minExperience: string;
  verifiedOnly: boolean;
  availableToday: boolean;
  useTime: boolean;
  onlyAvailable: boolean;
}

function WorkersSearch() {
  const { t, tk } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useSession();
  const { data: cats } = useLoad(() => api.get<{ categories: { slug: string }[] }>('/api/categories'), []);

  const [f, setF] = useState<Filters>({
    category: params.get('category') || '',
    q: params.get('q') || '',
    maxKm: params.get('maxKm') || '',
    priceType: '',
    minExperience: '',
    verifiedOnly: false,
    availableToday: false,
    useTime: false,
    onlyAvailable: true,
  });
  const [loc, setLoc] = useState<LocalityValue>({ localityId: params.get('localityId'), localityText: '', city: params.get('city') || '' });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [slot, setSlot] = useState<SlotValue>(defaultSlot());
  const [applied, setApplied] = useState(0);

  // Pre-fill the customer's own area once.
  useEffect(() => {
    if (user?.localityId && !loc.localityId && !loc.city) setLoc({ localityId: user.localityId, localityText: user.locality || '', city: user.city || '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const query = useMemo(
    () =>
      qs({
        category: f.category,
        q: f.q.trim(),
        city: loc.city,
        localityId: coords ? undefined : loc.localityId || undefined,
        lat: coords?.lat,
        lng: coords?.lng,
        maxKm: f.maxKm,
        priceType: f.priceType,
        minExperience: f.minExperience,
        verifiedOnly: f.verifiedOnly,
        availableToday: f.availableToday,
        date: f.useTime ? slot.date : undefined,
        startMinute: f.useTime ? slot.startMinute : undefined,
        durationMinutes: f.useTime ? slot.durationMinutes : undefined,
        onlyAvailable: f.useTime && f.onlyAvailable,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applied, loc.localityId, loc.city, coords],
  );

  const { data, error, loading, reload } = useLoad(
    () => api.get<{ workers: WorkerSummary[]; distanceUsed: boolean; total: number }>(`/api/workers${query}`),
    [query],
  );

  const set = (k: keyof Filters, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));
  const apply = (e?: React.FormEvent) => {
    e?.preventDefault();
    setApplied((n) => n + 1);
    router.replace(`/workers${qs({ category: f.category, q: f.q, city: loc.city, localityId: loc.localityId || undefined, maxKm: f.maxKm })}`, { scroll: false });
  };
  const bookHref = (id: string) =>
    `/workers/${id}?book=1${f.useTime ? `&date=${slot.date}&start=${slot.startMinute}&duration=${slot.durationMinutes}` : ''}`;

  return (
    <div className="container-page py-8">
      <PageHeader title={t('workers.title')} subtitle={t('workers.subtitle')} />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <form onSubmit={apply} className="card h-fit space-y-4 p-4" aria-label={t('common.filters')}>
          <SelectField label={t('workers.service')} value={f.category} onChange={(e) => set('category', e.target.value)}>
            <option value="">{t('workers.allServices')}</option>
            {(cats?.categories || []).map((c) => (
              <option key={c.slug} value={c.slug}>
                {tk('cat', c.slug)}
              </option>
            ))}
          </SelectField>
          <LocalityPicker value={loc} onChange={(v) => { setLoc(v); setCoords(null); }} allowFreeText={false} />
          <UseMyLocation active={!!coords} onLocated={setCoords} />
          <SelectField
            label={t('workers.distance')}
            value={f.maxKm}
            onChange={(e) => set('maxKm', e.target.value)}
            hint={!loc.localityId && !coords ? t('workers.distanceNeedsArea') : undefined}
          >
            <option value="">{t('workers.anyDistance')}</option>
            {[3, 5, 10, 20].map((n) => (
              <option key={n} value={n}>
                {t('workers.withinKm', { n })}
              </option>
            ))}
          </SelectField>

          <fieldset className="space-y-3 rounded-lg border border-stone-200 p-3">
            <legend className="px-1 text-sm font-semibold text-stone-800">{t('workers.when')}</legend>
            <Checkbox label={t('workers.date') + ' / ' + t('workers.startTime')} checked={f.useTime} onChange={(e) => set('useTime', e.target.checked)} />
            {f.useTime && (
              <>
                <SlotPicker value={slot} onChange={setSlot} />
                <Checkbox label={t('workers.onlyAvailable')} checked={f.onlyAvailable} onChange={(e) => set('onlyAvailable', e.target.checked)} />
              </>
            )}
          </fieldset>

          <SelectField label={t('workers.rateType')} value={f.priceType} onChange={(e) => set('priceType', e.target.value)}>
            <option value="">{t('workers.anyRate')}</option>
            <option value="visit">{t('price.visit')}</option>
            <option value="hourly">{t('price.hourly')}</option>
            <option value="fixed">{t('price.fixed')}</option>
          </SelectField>
          <SelectField label={t('workers.experience')} value={f.minExperience} onChange={(e) => set('minExperience', e.target.value)}>
            <option value="">{t('workers.anyExperience')}</option>
            {[1, 3, 5, 10].map((n) => (
              <option key={n} value={n}>
                {t('workers.minYears', { n })}
              </option>
            ))}
          </SelectField>
          <TextField label={t('common.search')} placeholder={t('workers.searchPlaceholder')} value={f.q} onChange={(e) => set('q', e.target.value)} optional />
          <Checkbox label={t('workers.availableToday')} checked={f.availableToday} onChange={(e) => set('availableToday', e.target.checked)} />
          <Checkbox label={t('workers.verifiedOnly')} checked={f.verifiedOnly} onChange={(e) => set('verifiedOnly', e.target.checked)} />
          <Button type="submit" className="w-full">
            <Search className="h-4 w-4" aria-hidden />
            {t('common.search')}
          </Button>
        </form>

        <div className="space-y-4">
          {f.category && <PriceIntelligenceCard categorySlug={f.category} />}
          {loading && <Spinner />}
          {!!error && <LoadError error={error} onRetry={reload} />}
          {data && !loading && (
            <>
              <p className="text-sm text-stone-700" aria-live="polite">
                {t('workers.results', { n: data.total })}
              </p>
              {data.workers.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title={t('workers.noResults')}
                  text={t('workers.noResultsHint')}
                  action={<LinkButton href={`/requests/new${qs({ category: f.category })}`}>{t('workers.postRequest')}</LinkButton>}
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.workers.map((w) => (
                    <WorkerCard key={w.id} w={w} bookHref={!user || user.role === 'customer' ? bookHref(w.id) : undefined} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WorkersPage() {
  return (
    <Suspense>
      <WorkersSearch />
    </Suspense>
  );
}
