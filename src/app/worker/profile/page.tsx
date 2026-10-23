'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Alert, Button, Checkbox, LinkButton, LoadError, PageHeader, RequireRole, Section, SelectField, Spinner, TextArea, TextField, useApiError, useFieldErrors, useLoad } from '@/components/ui';
import { LocalityPicker, LocalityValue, useLocalities } from '@/components/domain';

interface RateCard { serviceTitle: string; pricingBasis: string; amount: number; description: string | null }
interface Profile {
  id: string;
  headline: string | null;
  bio: string | null;
  category: string;
  experienceYears: number;
  skills: string[];
  languages: string[];
  localityId: string | null;
  locality: string;
  city: string;
  preferredLocalityIds: string[];
  serviceRadiusKm: number;
  acceptsOnDemand: boolean;
  openToJobs: boolean;
  pricingBasis: string;
  baseRate: number | null;
  hourlyRate: number | null;
  visitCharge: number | null;
  rateCards: RateCard[];
  experience: { id: string; roleTitle: string; employerName: string | null; startMonth: string; endMonth: string | null; locality: string | null }[];
}

const BASES = ['per-visit', 'per-hour', 'per-day', 'per-month', 'quoted'];
const list = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

function ProfileForm({ p, onSaved }: { p: Profile; onSaved: () => void }) {
  const { t, tk, lang } = useI18n();
  const errorText = useApiError();
  const fieldErrors = useFieldErrors();
  const localities = useLocalities();
  const { data: cats } = useLoad(() => api.get<{ categories: { slug: string }[] }>('/api/categories'), []);
  const [f, setF] = useState(() => ({
    headline: p.headline || '',
    bio: p.bio || '',
    category: p.category,
    experienceYears: String(p.experienceYears),
    skills: p.skills.join(', '),
    languages: p.languages.join(', '),
    serviceRadiusKm: String(p.serviceRadiusKm),
    acceptsOnDemand: p.acceptsOnDemand,
    openToJobs: p.openToJobs,
    pricingBasis: p.pricingBasis,
    baseRate: p.baseRate ? String(p.baseRate) : '',
    hourlyRate: p.hourlyRate ? String(p.hourlyRate) : '',
    visitCharge: p.visitCharge ? String(p.visitCharge) : '',
  }));
  const [loc, setLoc] = useState<LocalityValue>({ localityId: p.localityId, localityText: p.locality, city: p.city });
  const [preferred, setPreferred] = useState<string[]>(p.preferredLocalityIds);
  const [cards, setCards] = useState<RateCard[]>(p.rateCards);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<{ busy?: boolean; error?: string; ok?: boolean }>({});
  const set = (k: keyof typeof f, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));
  const num = (v: string) => (v.trim() === '' ? null : Number(v));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ busy: true });
    setErrors({});
    try {
      await api.patch('/api/worker/profile', {
        headline: f.headline.trim() || null,
        bio: f.bio.trim() || null,
        categorySlug: f.category,
        experienceYears: Number(f.experienceYears) || 0,
        skills: list(f.skills),
        languages: list(f.languages),
        serviceRadiusKm: Math.max(1, Math.min(100, Number(f.serviceRadiusKm) || 8)),
        acceptsOnDemand: f.acceptsOnDemand,
        openToJobs: f.openToJobs,
        pricingBasis: f.pricingBasis,
        baseRate: num(f.baseRate) ?? 0,
        hourlyRate: num(f.hourlyRate),
        visitCharge: num(f.visitCharge),
        localityId: loc.localityId || undefined,
        localityText: loc.localityId ? undefined : loc.localityText,
        city: loc.city,
        preferredLocalityIds: preferred,
        rateCards: cards.filter((c) => c.serviceTitle.trim()).map((c) => ({ ...c, amount: Number(c.amount) || 0, description: c.description || undefined })),
      });
      setState({ ok: true });
      onSaved();
    } catch (err) {
      setState({ error: errorText(err) });
      setErrors(fieldErrors(err));
    }
  };

  const nearby = localities.filter((l) => l.city === loc.city && l.id !== loc.localityId);

  return (
    <form className="space-y-6" onSubmit={save} noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <Section title={t('profile.about')}>
        <div className="space-y-4">
          <TextField label={t('wp.headline')} hint={t('wp.headlineHint')} value={f.headline} maxLength={160} optional onChange={(e) => set('headline', e.target.value)} />
          <TextArea label={t('wp.bio')} value={f.bio} maxLength={2000} optional onChange={(e) => set('bio', e.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label={t('auth.workType')} value={f.category} onChange={(e) => set('category', e.target.value)} error={errors.categorySlug}>
              {(cats?.categories || []).map((c) => (
                <option key={c.slug} value={c.slug}>{tk('cat', c.slug)}</option>
              ))}
            </SelectField>
            <TextField label={t('auth.experience')} type="number" min={0} max={60} value={f.experienceYears} onChange={(e) => set('experienceYears', e.target.value)} />
          </div>
          <TextField label={t('auth.skills')} hint={t('auth.skillsHint')} value={f.skills} optional onChange={(e) => set('skills', e.target.value)} />
          <TextField label={t('auth.languagesSpoken')} value={f.languages} optional onChange={(e) => set('languages', e.target.value)} />
          <fieldset className="space-y-3">
            <legend className="mb-1 text-sm font-semibold text-stone-800">{t('wp.workTypes')}</legend>
            <Checkbox label={t('auth.acceptsOnDemand')} checked={f.acceptsOnDemand} onChange={(e) => set('acceptsOnDemand', e.target.checked)} />
            <Checkbox label={t('auth.openToJobs')} checked={f.openToJobs} onChange={(e) => set('openToJobs', e.target.checked)} />
          </fieldset>
        </div>
      </Section>

      <Section title={t('wp.areas')}>
        <div className="space-y-4">
          <LocalityPicker value={loc} onChange={setLoc} label={t('wp.homeArea')} error={errors.localityId} />
          {nearby.length > 0 && (
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-stone-800">{t('wp.preferredAreas')}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {nearby.map((l) => (
                  <Checkbox
                    key={l.id}
                    label={lang === 'hi' && l.nameHi ? l.nameHi : l.name}
                    checked={preferred.includes(l.id)}
                    onChange={(e) => setPreferred(e.target.checked ? [...preferred, l.id] : preferred.filter((x) => x !== l.id))}
                  />
                ))}
              </div>
            </fieldset>
          )}
          <TextField label={t('wp.travel')} type="number" min={1} max={100} className="max-w-[200px]" value={f.serviceRadiusKm} onChange={(e) => set('serviceRadiusKm', e.target.value)} />
        </div>
      </Section>

      <Section title={t('wp.rates')}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={t('wp.visitCharge')} type="number" min={0} value={f.visitCharge} optional onChange={(e) => set('visitCharge', e.target.value)} />
            <TextField label={t('wp.hourlyRate')} type="number" min={0} value={f.hourlyRate} optional onChange={(e) => set('hourlyRate', e.target.value)} />
            <SelectField label={t('wp.pricingBasis')} value={f.pricingBasis} onChange={(e) => set('pricingBasis', e.target.value)}>
              {BASES.map((b) => <option key={b} value={b}>{tk('price.basis', b)}</option>)}
            </SelectField>
            <TextField label={t('wp.baseRate')} type="number" min={0} value={f.baseRate} onChange={(e) => set('baseRate', e.target.value)} />
          </div>
          <p className="text-sm text-stone-600">{t('price.indicativeHint')}</p>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-stone-800">{t('wp.rateCards')}</legend>
            <div className="space-y-3">
              {cards.map((c, i) => (
                <div key={i} className="grid gap-2 rounded-lg border border-stone-200 p-3 sm:grid-cols-[1fr_140px_140px_auto] sm:items-end">
                  <TextField label={t('wp.rateTitle')} value={c.serviceTitle} maxLength={150} onChange={(e) => setCards(cards.map((x, j) => (j === i ? { ...x, serviceTitle: e.target.value } : x)))} />
                  <TextField label={t('wp.rateAmount')} type="number" min={0} value={String(c.amount)} onChange={(e) => setCards(cards.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) } : x)))} />
                  <SelectField label={t('wp.pricingBasis')} value={c.pricingBasis} onChange={(e) => setCards(cards.map((x, j) => (j === i ? { ...x, pricingBasis: e.target.value } : x)))}>
                    {BASES.map((b) => <option key={b} value={b}>{tk('price.basis', b)}</option>)}
                  </SelectField>
                  <Button variant="ghost" aria-label={t('common.remove')} onClick={() => setCards(cards.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              ))}
              {cards.length < 12 && (
                <Button variant="secondary" onClick={() => setCards([...cards, { serviceTitle: '', pricingBasis: 'per-visit', amount: 0, description: null }])}>
                  <Plus className="h-4 w-4" aria-hidden />
                  {t('wp.addRateCard')}
                </Button>
              )}
            </div>
          </fieldset>
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex items-center gap-3 border-t border-stone-200 bg-paper px-4 py-3 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <Button type="submit" loading={state.busy}>{t('common.save')}</Button>
        {state.ok && <span role="status" className="text-sm font-medium text-green-800">{t('common.saved')}</span>}
      </div>
    </form>
  );
}

function ExperienceEditor({ items, onChanged }: { items: Profile['experience']; onChanged: () => void }) {
  const { t } = useI18n();
  const errorText = useApiError();
  const [f, setF] = useState({ roleTitle: '', employerName: '', startMonth: '', endMonth: '' });
  const [state, setState] = useState<{ busy?: boolean; error?: string }>({});
  return (
    <Section title={t('wp.experienceTitle')}>
      {items.length > 0 && (
        <ul className="mb-4 divide-y divide-stone-200 rounded-lg border border-stone-200">
          {items.map((x) => (
            <li key={x.id} className="flex items-center justify-between gap-2 p-3 text-sm">
              <span>
                <span className="font-semibold text-stone-900">{x.roleTitle}</span>
                {x.employerName && ` · ${x.employerName}`}
                <span className="block text-stone-600">{x.startMonth} – {x.endMonth || t('profile.present')}</span>
              </span>
              <Button variant="ghost" aria-label={t('common.remove')} onClick={async () => { await api.del(`/api/worker/experience/${x.id}`).catch(() => undefined); onChanged(); }}>
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
          if (f.roleTitle.trim().length < 2 || !f.startMonth) return setState({ error: t('errors.validation_failed') });
          setState({ busy: true });
          try {
            await api.post('/api/worker/experience', { roleTitle: f.roleTitle.trim(), employerName: f.employerName.trim() || undefined, startMonth: f.startMonth, endMonth: f.endMonth || null });
            setF({ roleTitle: '', employerName: '', startMonth: '', endMonth: '' });
            setState({});
            onChanged();
          } catch (err) {
            setState({ error: errorText(err) });
          }
        }}
      >
        {state.error && <Alert tone="error">{state.error}</Alert>}
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label={t('wp.roleTitle')} value={f.roleTitle} maxLength={120} required onChange={(e) => setF({ ...f, roleTitle: e.target.value })} />
          <TextField label={t('wp.employerName')} value={f.employerName} maxLength={150} onChange={(e) => setF({ ...f, employerName: e.target.value })} />
          <TextField label={t('wp.startMonth')} type="month" value={f.startMonth} required onChange={(e) => setF({ ...f, startMonth: e.target.value })} />
          <TextField label={t('wp.endMonth')} type="month" value={f.endMonth} onChange={(e) => setF({ ...f, endMonth: e.target.value })} />
        </div>
        <Button type="submit" variant="secondary" loading={state.busy}>
          <Plus className="h-4 w-4" aria-hidden />
          {t('wp.addExperience')}
        </Button>
      </form>
    </Section>
  );
}

function Editor() {
  const { t } = useI18n();
  const { data, error, loading, reload } = useLoad(() => api.get<{ profile: Profile }>('/api/worker/profile').then((r) => r.profile), []);
  const [version, setVersion] = useState(0);
  useEffect(() => setVersion((v) => v + 1), [data]);
  if (loading && !data) return <Spinner />;
  if (error || !data) return <LoadError error={error} onRetry={reload} />;
  return (
    <>
      <PageHeader title={t('wp.title')} subtitle={t('wp.subtitle')} actions={<LinkButton href={`/workers/${data.id}`} variant="secondary">{t('wp.viewPublic')}</LinkButton>} />
      <div className="space-y-6">
        <ProfileForm key={version} p={data} onSaved={reload} />
        <ExperienceEditor items={data.experience} onChanged={reload} />
      </div>
    </>
  );
}

export default function WorkerProfilePage() {
  return (
    <RequireRole roles={['worker']}>
      <div className="container-page max-w-4xl py-8">
        <Editor />
      </div>
    </RequireRole>
  );
}
