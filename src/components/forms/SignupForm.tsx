'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { dashboardPath, useSession } from '@/lib/session';
import { Alert, Button, Checkbox, ChoiceGroup, SelectField, TextField, useApiError, useFieldErrors, useLoad } from '@/components/ui';
import { LocalityPicker, LocalityValue } from '@/components/domain';

type Role = 'customer' | 'worker' | 'employer';
const splitList = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

export default function SignupForm({ initialRole, lockRole }: { initialRole?: Role; lockRole?: boolean }) {
  const { t, tk, lang } = useI18n();
  const router = useRouter();
  const { refresh } = useSession();
  const errorText = useApiError();
  const fieldErrors = useFieldErrors();
  const { data: cats } = useLoad(() => api.get<{ categories: { slug: string }[] }>('/api/categories'), []);

  const [role, setRole] = useState<Role | ''>(initialRole || '');
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    fullName: '',
    phone: '',
    password: '',
    organisationName: '',
    categorySlug: '',
    experienceYears: '0',
    skills: '',
    languages: lang === 'hi' ? 'Hindi' : 'Hindi, English',
    acceptsOnDemand: true,
    openToJobs: false,
    assisted: false,
    assistedBy: '',
    acceptPrivacy: false,
  });
  const [loc, setLoc] = useState<LocalityValue>({ localityId: null, localityText: '', city: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  const steps =
    role === 'worker'
      ? (['you', 'work', 'area', 'finish'] as const)
      : (['you', 'area', 'finish'] as const);
  const current = steps[step];

  const validate = (which: string) => {
    const e: Record<string, string> = {};
    if (which === 'you') {
      if (f.fullName.trim().length < 2) e.fullName = t('validation.required');
      if (!/^[6-9]\d{9}$/.test(f.phone.replace(/\D/g, '').slice(-10))) e.phone = t('validation.invalid_phone');
      if (role === 'employer' && f.organisationName.trim().length < 2) e.organisationName = t('validation.required');
    }
    if (which === 'work' && !f.categorySlug) e.categorySlug = t('validation.required');
    if (which === 'area') {
      if (!loc.city) e.city = t('validation.required');
      if (!loc.localityId && loc.localityText.trim().length < 2) e.localityId = t('validation.required');
    }
    if (which === 'finish') {
      if (f.password.length < 8) e.password = t('validation.password_short');
      if (!f.acceptPrivacy) e.acceptPrivacy = t('validation.accept_privacy');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate('finish')) return;
    setBusy(true);
    setFormError(null);
    try {
      await api.post('/api/auth/signup', {
        role,
        fullName: f.fullName.trim(),
        phone: f.phone,
        password: f.password,
        city: loc.city,
        localityId: loc.localityId,
        localityText: loc.localityId ? undefined : loc.localityText,
        language: lang,
        acceptPrivacy: f.acceptPrivacy,
        organisationName: role === 'employer' ? f.organisationName : undefined,
        categorySlug: role === 'worker' ? f.categorySlug : undefined,
        experienceYears: role === 'worker' ? Number(f.experienceYears) || 0 : undefined,
        skills: role === 'worker' ? splitList(f.skills) : undefined,
        languages: role === 'worker' ? splitList(f.languages) : undefined,
        acceptsOnDemand: role === 'worker' ? f.acceptsOnDemand : undefined,
        openToJobs: role === 'worker' ? f.openToJobs : undefined,
        assistedBy: role === 'worker' && f.assisted ? f.assistedBy : undefined,
      });
      const u = await refresh();
      router.push(role === 'worker' ? '/worker/schedule?welcome=1' : dashboardPath(u?.role));
    } catch (e) {
      setFormError(errorText(e));
      const fe = fieldErrors(e);
      setErrors(fe);
      // Jump back to the step that has the problem.
      if (fe.phone || fe.fullName || fe.organisationName) setStep(0);
      setBusy(false);
    }
  };

  if (!role) {
    return (
      <div className="card space-y-4 p-5">
        <ChoiceGroup<Role>
          legend={t('auth.iAm')}
          value=""
          onChange={(r) => setRole(r)}
          options={[
            { value: 'customer', label: t('auth.roleCustomer'), hint: t('auth.roleCustomerHint') },
            { value: 'worker', label: t('auth.roleWorker'), hint: t('auth.roleWorkerHint') },
            { value: 'employer', label: t('auth.roleEmployer'), hint: t('auth.roleEmployerHint') },
          ]}
        />
      </div>
    );
  }

  const stepTitle = { you: t('auth.stepYou'), work: t('auth.stepWork'), area: t('auth.stepArea'), finish: t('auth.stepFinish') }[current];

  return (
    <form
      className="card space-y-5 p-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (current === 'finish') submit();
        else if (validate(current)) setStep(step + 1);
      }}
    >
      <div>
        <p className="text-sm font-medium text-stone-600">{t('common.step', { n: step + 1, total: steps.length })}</p>
        <h2 className="text-lg font-semibold text-stone-900">{stepTitle}</h2>
        <div className="mt-2 h-1.5 rounded-full bg-stone-200" aria-hidden>
          <div className="h-1.5 rounded-full bg-brand-700" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
      </div>
      {formError && <Alert tone="error">{formError}</Alert>}

      {current === 'you' && (
        <>
          {role === 'worker' && (
            <div className="space-y-3 rounded-lg bg-stone-50 p-3">
              <Checkbox label={t('auth.assisted')} hint={t('auth.assistedHint')} checked={f.assisted} onChange={(e) => set('assisted', e.target.checked)} />
              {f.assisted && <TextField label={t('auth.assistedName')} value={f.assistedBy} maxLength={150} onChange={(e) => set('assistedBy', e.target.value)} />}
            </div>
          )}
          <TextField label={t('common.name')} autoComplete="name" value={f.fullName} error={errors.fullName} required maxLength={150} onChange={(e) => set('fullName', e.target.value)} />
          <TextField label={t('common.phone')} type="tel" inputMode="numeric" autoComplete="tel" value={f.phone} error={errors.phone} required onChange={(e) => set('phone', e.target.value)} />
          {role === 'employer' && (
            <TextField label={t('auth.organisation')} value={f.organisationName} error={errors.organisationName} required maxLength={150} onChange={(e) => set('organisationName', e.target.value)} />
          )}
        </>
      )}

      {current === 'work' && (
        <>
          <SelectField label={t('auth.workType')} value={f.categorySlug} error={errors.categorySlug} required onChange={(e) => set('categorySlug', e.target.value)}>
            <option value="">—</option>
            {(cats?.categories || []).map((c) => (
              <option key={c.slug} value={c.slug}>
                {tk('cat', c.slug)}
              </option>
            ))}
          </SelectField>
          <TextField label={t('auth.experience')} type="number" min={0} max={60} inputMode="numeric" value={f.experienceYears} onChange={(e) => set('experienceYears', e.target.value)} />
          <TextField label={t('auth.skills')} hint={t('auth.skillsHint')} value={f.skills} optional onChange={(e) => set('skills', e.target.value)} />
          <TextField label={t('auth.languagesSpoken')} value={f.languages} optional onChange={(e) => set('languages', e.target.value)} />
          <fieldset className="space-y-3">
            <legend className="mb-1 text-sm font-semibold text-stone-800">{t('wp.workTypes')}</legend>
            <Checkbox label={t('auth.acceptsOnDemand')} checked={f.acceptsOnDemand} onChange={(e) => set('acceptsOnDemand', e.target.checked)} />
            <Checkbox label={t('auth.openToJobs')} checked={f.openToJobs} onChange={(e) => set('openToJobs', e.target.checked)} />
          </fieldset>
        </>
      )}

      {current === 'area' && <LocalityPicker value={loc} onChange={setLoc} error={errors.localityId || errors.city} />}

      {current === 'finish' && (
        <>
          <TextField
            label={t('common.password')}
            type="password"
            autoComplete="new-password"
            hint={t('auth.passwordHint')}
            value={f.password}
            error={errors.password}
            required
            onChange={(e) => set('password', e.target.value)}
          />
          <div>
            <Checkbox
              label={
                <>
                  {t('auth.privacyAccept')}{' '}
                  <Link href="/privacy" target="_blank" className="link">
                    {t('auth.privacyLink')}
                  </Link>
                </>
              }
              checked={f.acceptPrivacy}
              onChange={(e) => set('acceptPrivacy', e.target.checked)}
            />
            {errors.acceptPrivacy && <p className="mt-1 text-sm font-medium text-red-700">{errors.acceptPrivacy}</p>}
          </div>
        </>
      )}

      <div className="flex flex-wrap justify-between gap-2 pt-2">
        <Button
          variant="secondary"
          onClick={() => {
            setErrors({});
            if (step === 0 && !lockRole && !initialRole) setRole('');
            else if (step === 0 && !lockRole) setRole('');
            else setStep(step - 1);
          }}
          disabled={step === 0 && lockRole}
        >
          {t('common.back')}
        </Button>
        <Button type="submit" loading={busy}>
          {current === 'finish' ? (busy ? t('auth.creating') : t('auth.signupButton')) : t('common.next')}
        </Button>
      </div>
    </form>
  );
}
