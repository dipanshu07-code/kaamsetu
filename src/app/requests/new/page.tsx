'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ImagePlus, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { Alert, Button, ChoiceGroup, PageHeader, RequireRole, SelectField, TextArea, TextField, useApiError, useFieldErrors, useLoad } from '@/components/ui';
import { LocalityPicker, LocalityValue, SlotPicker, SlotValue, defaultSlot, slotToIso } from '@/components/domain';

const MAX_PHOTOS = 3;
const MAX_BYTES = 2 * 1024 * 1024;

function NewRequest() {
  const { t, tk } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useSession();
  const errorText = useApiError();
  const fieldErrors = useFieldErrors();
  const { data: cats } = useLoad(() => api.get<{ categories: { slug: string }[] }>('/api/categories'), []);

  const steps = ['what', 'where', 'when'] as const;
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState(params.get('category') || '');
  const [problem, setProblem] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [loc, setLoc] = useState<LocalityValue>({ localityId: user?.localityId || null, localityText: user?.locality || '', city: user?.city || '' });
  const [address, setAddress] = useState({ house: '', pincode: '', landmark: '' });
  const [slot, setSlot] = useState<SlotValue>(defaultSlot());
  const [priceType, setPriceType] = useState<'' | 'visit' | 'hourly' | 'fixed'>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const validate = (s: (typeof steps)[number]) => {
    const e: Record<string, string> = {};
    if (s === 'what') {
      if (!category) e.categorySlug = t('validation.required');
      if (problem.trim().length < 5) e.problem = t('validation.too_short');
    }
    if (s === 'where') {
      if (!loc.city) e.city = t('validation.required');
      if (!loc.localityId && loc.localityText.trim().length < 2) e.localityId = t('validation.required');
      if (address.house.trim().length < 2) e['address.house'] = t('validation.required');
      if (address.pincode && !/^\d{6}$/.test(address.pincode)) e['address.pincode'] = t('validation.invalid');
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const ok: File[] = [];
    for (const f of Array.from(files)) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) return setErrors({ photos: t('errors.photo_bad_type') });
      if (f.size > MAX_BYTES) return setErrors({ photos: t('errors.photo_too_large') });
      ok.push(f);
    }
    setErrors({});
    setPhotos((p) => [...p, ...ok].slice(0, MAX_PHOTOS));
  };

  const submit = async () => {
    setBusy(true);
    setFormError(null);
    try {
      const res = await api.post<{ id: string; alerted: number }>('/api/requests', {
        categorySlug: category,
        problem: problem.trim(),
        localityId: loc.localityId,
        address: { house: address.house, locality: loc.localityText, city: loc.city, pincode: address.pincode, landmark: address.landmark || undefined },
        start: slotToIso(slot),
        durationMinutes: slot.durationMinutes,
        priceType: priceType || undefined,
      });
      let photoFailed = false;
      for (const p of photos) {
        const fd = new FormData();
        fd.append('photo', p);
        await api.upload(`/api/requests/${res.id}/photos`, fd).catch(() => (photoFailed = true));
      }
      router.push(`/requests/${res.id}?alerted=${res.alerted}${photoFailed ? '&photoFailed=1' : ''}`);
    } catch (e) {
      setFormError(errorText(e));
      const fe = fieldErrors(e);
      setErrors(fe);
      if ((e as any)?.code === 'start_too_soon' || (e as any)?.code === 'start_too_far') setStep(2);
      else if (fe.problem || fe.categorySlug) setStep(0);
      else if (Object.keys(fe).some((k) => k.startsWith('address') || k === 'localityId')) setStep(1);
      setBusy(false);
    }
  };

  const current = steps[step];
  const titles = { what: t('request.service'), where: t('request.where'), when: t('request.when') };

  return (
    <div className="container-page max-w-2xl py-8">
      <PageHeader title={t('request.newTitle')} subtitle={t('request.newSubtitle')} />
      <form
        noValidate
        className="card space-y-5 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!validate(current)) return;
          if (current === 'when') submit();
          else setStep(step + 1);
        }}
      >
        <div>
          <p className="text-sm font-medium text-stone-600">{t('common.step', { n: step + 1, total: steps.length })}</p>
          <h2 className="text-lg font-semibold text-stone-900">{titles[current]}</h2>
          <div className="mt-2 h-1.5 rounded-full bg-stone-200" aria-hidden>
            <div className="h-1.5 rounded-full bg-brand-700" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
        </div>
        {formError && <Alert tone="error">{formError}</Alert>}

        {current === 'what' && (
          <>
            <SelectField label={t('request.service')} value={category} error={errors.categorySlug} required onChange={(e) => setCategory(e.target.value)}>
              <option value="">—</option>
              {(cats?.categories || [])
                .filter((c) => c.slug !== 'construction')
                .map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {tk('cat', c.slug)}
                  </option>
                ))}
            </SelectField>
            <TextArea label={t('request.problem')} hint={t('request.problemHint')} value={problem} error={errors.problem} maxLength={2000} required onChange={(e) => setProblem(e.target.value)} />
            <div>
              <p className="text-sm font-semibold text-stone-800">{t('request.photos')}</p>
              <p className="text-sm text-stone-600">{t('request.photosHint')}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {photos.map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-md border border-stone-300 bg-stone-50 px-2 py-1 text-sm">
                    <span className="max-w-[160px] truncate">{p.name}</span>
                    <button type="button" aria-label={`${t('common.remove')} ${p.name}`} onClick={() => setPhotos(photos.filter((_, j) => j !== i))} className="rounded p-0.5 hover:bg-stone-200">
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </span>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-dashed border-stone-400 px-3 text-sm font-semibold text-stone-800 focus-within:outline focus-within:outline-2 focus-within:outline-brand-700 hover:bg-stone-50">
                    <ImagePlus className="h-4 w-4" aria-hidden />
                    {t('common.add')}
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => addPhotos(e.target.files)} />
                  </label>
                )}
              </div>
              {errors.photos && <p className="mt-1 text-sm font-medium text-red-700">{errors.photos}</p>}
            </div>
          </>
        )}

        {current === 'where' && (
          <>
            <LocalityPicker value={loc} onChange={setLoc} error={errors.localityId || errors.city} />
            <TextField label={t('bookForm.house')} value={address.house} error={errors['address.house']} required maxLength={200} onChange={(e) => setAddress({ ...address, house: e.target.value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label={t('bookForm.pincode')} inputMode="numeric" maxLength={6} value={address.pincode} error={errors['address.pincode']} optional onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
              <TextField label={t('bookForm.landmark')} value={address.landmark} optional maxLength={200} onChange={(e) => setAddress({ ...address, landmark: e.target.value })} />
            </div>
            <p className="text-sm text-stone-600">{t('bookForm.addressPrivacy')}</p>
          </>
        )}

        {current === 'when' && (
          <>
            <SlotPicker value={slot} onChange={setSlot} />
            <ChoiceGroup<'' | 'visit' | 'hourly' | 'fixed'>
              legend={t('request.priceType')}
              value={priceType}
              onChange={setPriceType}
              columns={2}
              options={[
                { value: '', label: t('request.anyPrice') },
                { value: 'visit', label: t('price.visit') },
                { value: 'hourly', label: t('price.hourly') },
                { value: 'fixed', label: t('price.fixed') },
              ]}
            />
          </>
        )}

        <div className="flex flex-wrap justify-between gap-2">
          <Button variant="secondary" onClick={() => setStep(step - 1)} disabled={step === 0 || busy}>
            {t('common.back')}
          </Button>
          <Button type="submit" loading={busy}>
            {current === 'when' ? (busy ? t('request.submitting') : t('request.submit')) : t('common.next')}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewRequestPage() {
  return (
    <RequireRole roles={['customer']}>
      <Suspense>
        <NewRequest />
      </Suspense>
    </RequireRole>
  );
}
