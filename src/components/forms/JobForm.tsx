'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { EMPLOYMENT_TYPES, PAY_PERIODS } from '@/lib/domain';
import { Alert, Button, ChoiceGroup, SelectField, TextArea, TextField, useApiError, useFieldErrors, useLoad } from '@/components/ui';
import { LocalityPicker, LocalityValue } from '@/components/domain';

export interface JobInput {
  title: string;
  duties: string;
  tradeSlug: string;
  employmentType: string;
  payMin: string;
  payMax: string;
  payPeriod: string;
  schedule: string;
  openings: string;
  requiredSkills: string;
  applicationMethod: 'in_app' | 'phone' | 'email';
  contactValue: string;
  closesOn: string;
}

export const emptyJob: JobInput = {
  title: '',
  duties: '',
  tradeSlug: '',
  employmentType: 'full_time',
  payMin: '',
  payMax: '',
  payPeriod: 'month',
  schedule: '',
  openings: '1',
  requiredSkills: '',
  applicationMethod: 'in_app',
  contactValue: '',
  closesOn: '',
};

export default function JobForm({
  initial,
  initialLocation,
  jobId,
  onSaved,
}: {
  initial: JobInput;
  initialLocation: LocalityValue;
  jobId?: string;
  onSaved: (id: string) => void;
}) {
  const { t, tk } = useI18n();
  const errorText = useApiError();
  const fieldErrors = useFieldErrors();
  const { data: cats } = useLoad(() => api.get<{ categories: { slug: string }[] }>('/api/categories'), []);
  const [f, setF] = useState<JobInput>(initial);
  const [loc, setLoc] = useState<LocalityValue>(initialLocation);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<{ busy?: boolean; error?: string }>({});
  const set = (k: keyof JobInput, v: string) => setF((x) => ({ ...x, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v: Record<string, string> = {};
    if (f.title.trim().length < 3) v.title = t('validation.too_short');
    if (f.duties.trim().length < 10) v.duties = t('validation.too_short');
    if (f.schedule.trim().length < 3) v.schedule = t('validation.required');
    if (!loc.city || (!loc.localityId && loc.localityText.trim().length < 2)) v.localityId = t('validation.required');
    if (f.payMin && f.payMax && Number(f.payMax) < Number(f.payMin)) v.payMax = t('validation.invalid');
    if (f.applicationMethod !== 'in_app' && !f.contactValue.trim()) v.contactValue = t('validation.required');
    setErrors(v);
    if (Object.keys(v).length) return;
    setState({ busy: true });
    const body = {
      title: f.title.trim(),
      duties: f.duties.trim(),
      tradeSlug: f.tradeSlug || null,
      localityId: loc.localityId,
      localityText: loc.localityId ? undefined : loc.localityText,
      city: loc.city,
      requiredSkills: f.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
      employmentType: f.employmentType,
      payMin: f.payMin ? Number(f.payMin) : null,
      payMax: f.payMax ? Number(f.payMax) : null,
      payPeriod: f.payPeriod,
      schedule: f.schedule.trim(),
      openings: Number(f.openings) || 1,
      applicationMethod: f.applicationMethod,
      contactValue: f.applicationMethod === 'in_app' ? undefined : f.contactValue.trim(),
      closesOn: f.closesOn || null,
    };
    try {
      if (jobId) {
        await api.put(`/api/jobs/${jobId}`, body);
        onSaved(jobId);
      } else {
        const res = await api.post<{ id: string }>('/api/jobs', body);
        onSaved(res.id);
      }
    } catch (err) {
      setState({ error: errorText(err) });
      setErrors(fieldErrors(err));
      return;
    }
    setState({});
  };

  return (
    <form className="card space-y-4 p-5" onSubmit={submit} noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <TextField label={t('emp.jobTitle')} value={f.title} error={errors.title} required maxLength={150} onChange={(e) => set('title', e.target.value)} />
      <TextArea label={t('emp.duties')} hint={t('emp.dutiesHint')} value={f.duties} error={errors.duties} required maxLength={4000} onChange={(e) => set('duties', e.target.value)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label={t('emp.employmentType')} value={f.employmentType} onChange={(e) => set('employmentType', e.target.value)}>
          {EMPLOYMENT_TYPES.map((x) => <option key={x} value={x}>{tk('employment', x)}</option>)}
        </SelectField>
        <SelectField label={t('emp.trade')} value={f.tradeSlug} optional onChange={(e) => set('tradeSlug', e.target.value)}>
          <option value="">—</option>
          {(cats?.categories || []).map((c) => <option key={c.slug} value={c.slug}>{tk('cat', c.slug)}</option>)}
        </SelectField>
      </div>
      <fieldset className="space-y-3 rounded-lg border border-stone-200 p-3">
        <legend className="px-1 text-sm font-semibold text-stone-800">{t('emp.location')}</legend>
        <LocalityPicker value={loc} onChange={setLoc} error={errors.localityId} />
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label={t('emp.payMin')} type="number" min={0} value={f.payMin} optional onChange={(e) => set('payMin', e.target.value)} />
        <TextField label={t('emp.payMax')} type="number" min={0} value={f.payMax} error={errors.payMax} optional onChange={(e) => set('payMax', e.target.value)} />
        <SelectField label={t('emp.payPeriod')} value={f.payPeriod} onChange={(e) => set('payPeriod', e.target.value)}>
          {PAY_PERIODS.map((p) => <option key={p} value={p}>{tk('period', p)}</option>)}
        </SelectField>
      </div>
      <p className="text-sm text-stone-600">{t('emp.wageNote')}</p>
      <TextField label={t('emp.schedule')} value={f.schedule} error={errors.schedule} required maxLength={300} onChange={(e) => set('schedule', e.target.value)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t('emp.openings')} type="number" min={1} max={500} value={f.openings} onChange={(e) => set('openings', e.target.value)} />
        <TextField label={t('emp.closesOn')} type="date" value={f.closesOn} optional onChange={(e) => set('closesOn', e.target.value)} />
      </div>
      <TextField label={t('emp.skills')} value={f.requiredSkills} optional onChange={(e) => set('requiredSkills', e.target.value)} />
      <ChoiceGroup<'in_app' | 'phone' | 'email'>
        legend={t('emp.applicationMethod')}
        value={f.applicationMethod}
        onChange={(v) => set('applicationMethod', v)}
        options={[
          { value: 'in_app', label: t('emp.method.in_app') },
          { value: 'phone', label: t('emp.method.phone') },
          { value: 'email', label: t('emp.method.email') },
        ]}
      />
      {f.applicationMethod !== 'in_app' && (
        <TextField label={t('emp.contact')} value={f.contactValue} error={errors.contactValue} required maxLength={150} onChange={(e) => set('contactValue', e.target.value)} />
      )}
      <Button type="submit" loading={state.busy}>{jobId ? t('emp.update') : t('emp.publish')}</Button>
    </form>
  );
}
