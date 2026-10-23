'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarCheck, CalendarX2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { overlaps, withinWorkingHours } from '@/lib/domain';
import { useSession } from '@/lib/session';
import { Alert, Button, ChoiceGroup, SelectField, TextArea, TextField, useApiError, useFieldErrors } from '@/components/ui';
import { SlotPicker, SlotValue, slotToIso } from '@/components/domain';
import type { Availability } from '@/components/AvailabilityList';

interface Props {
  worker: {
    id: string;
    fullName: string;
    category: string;
    hourlyRate: number | null;
    visitCharge: number | null;
    baseRate: number | null;
    pricingBasis: string;
    rateCards: { id: string; serviceTitle: string; amount: number; pricingBasis: string }[];
  };
  availability: Availability | null;
  initialSlot: SlotValue;
}

type PriceType = 'visit' | 'hourly' | 'fixed';

export default function BookingForm({ worker, availability, initialSlot }: Props) {
  const { t, tk, formatMoney } = useI18n();
  const { user } = useSession();
  const router = useRouter();
  const errorText = useApiError();
  const fieldErrors = useFieldErrors();
  const steps = ['what', 'when', 'where', 'price', 'review'] as const;
  const [step, setStep] = useState(0);
  const [serviceTitle, setServiceTitle] = useState(worker.rateCards[0]?.serviceTitle || tk('cat', worker.category));
  const [description, setDescription] = useState('');
  const [slot, setSlot] = useState<SlotValue>(initialSlot);
  const [address, setAddress] = useState({ house: '', locality: user?.locality || '', city: user?.city || '', pincode: '', landmark: '' });
  const defaultType: PriceType = worker.visitCharge ? 'visit' : worker.hourlyRate ? 'hourly' : worker.pricingBasis === 'per-hour' ? 'hourly' : worker.pricingBasis === 'quoted' ? 'fixed' : 'visit';
  const [priceType, setPriceType] = useState<PriceType>(defaultType);
  const [amount, setAmount] = useState<string>(String((defaultType === 'hourly' ? worker.hourlyRate : worker.visitCharge) || worker.baseRate || ''));
  const [payment, setPayment] = useState<'cash_on_completion' | 'upi_direct'>('cash_on_completion');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [idempotencyKey] = useState(() => `bk-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);

  const slotState = useMemo(() => {
    if (!availability) return null;
    const start = new Date(slotToIso(slot));
    const end = new Date(start.getTime() + slot.durationMinutes * 60_000);
    const busyNow = availability.unavailable.some((u) => overlaps(start, end, new Date(u.start), new Date(u.end)));
    if (busyNow || !withinWorkingHours(availability.workingHours, start, end)) return 'busy';
    return 'free';
  }, [availability, slot]);

  const validate = (s: (typeof steps)[number]) => {
    const e: Record<string, string> = {};
    if (s === 'what') {
      if (serviceTitle.trim().length < 2) e.serviceTitle = t('validation.required');
      if (description.trim().length < 5) e.description = t('validation.too_short');
    }
    if (s === 'when' && slotState === 'busy') e.slot = t('bookForm.slotBusy');
    if (s === 'where') {
      if (address.house.trim().length < 2) e['address.house'] = t('validation.required');
      if (address.locality.trim().length < 2) e['address.locality'] = t('validation.required');
      if (address.city.trim().length < 2) e['address.city'] = t('validation.required');
      if (address.pincode && !/^\d{6}$/.test(address.pincode)) e['address.pincode'] = t('validation.invalid');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    setBusy(true);
    setFormError(null);
    try {
      const { booking } = await api.post<{ booking: { id: string } }>('/api/bookings', {
        workerId: worker.id,
        serviceTitle: serviceTitle.trim(),
        start: slotToIso(slot),
        durationMinutes: slot.durationMinutes,
        address,
        description: description.trim(),
        priceType,
        indicativeAmount: amount ? Number(amount) : undefined,
        paymentMethod: payment,
        idempotencyKey,
      });
      router.push(`/bookings/${booking.id}?new=1`);
    } catch (e) {
      setFormError(errorText(e));
      const fe = fieldErrors(e);
      setErrors(fe);
      if ((e as any)?.code === 'slot_unavailable') setStep(1);
      else if (Object.keys(fe).some((k) => k.startsWith('address'))) setStep(2);
      setBusy(false);
    }
  };

  const current = steps[step];
  const titles = { what: t('bookForm.whatWork'), when: t('bookForm.when'), where: t('bookForm.address'), price: t('bookForm.price'), review: t('bookForm.review') };

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (current === 'review') submit();
        else if (validate(current)) setStep(step + 1);
      }}
    >
      <div>
        <p className="text-sm font-medium text-stone-600">{t('common.step', { n: step + 1, total: steps.length })}</p>
        <h3 className="text-lg font-semibold text-stone-900">{titles[current]}</h3>
      </div>
      {formError && <Alert tone="error">{formError}</Alert>}

      {current === 'what' && (
        <>
          {worker.rateCards.length > 0 ? (
            <SelectField label={t('bookForm.serviceTitle')} value={serviceTitle} onChange={(e) => setServiceTitle(e.target.value)} error={errors.serviceTitle}>
              {worker.rateCards.map((rc) => (
                <option key={rc.id} value={rc.serviceTitle}>
                  {rc.serviceTitle} — {formatMoney(rc.amount)} {tk('price.basis', rc.pricingBasis)}
                </option>
              ))}
            </SelectField>
          ) : (
            <TextField label={t('bookForm.serviceTitle')} value={serviceTitle} onChange={(e) => setServiceTitle(e.target.value)} error={errors.serviceTitle} required />
          )}
          <TextArea label={t('bookForm.describe')} hint={t('bookForm.describeHint')} value={description} onChange={(e) => setDescription(e.target.value)} error={errors.description} required maxLength={2000} />
        </>
      )}

      {current === 'when' && (
        <>
          <SlotPicker
            value={slot}
            onChange={(v) => {
              setSlot(v);
              setErrors({});
            }}
          />
          {errors.slot && <Alert tone="error">{errors.slot}</Alert>}
          {slotState === 'free' && (
            <Alert tone="success">
              <span className="inline-flex items-center gap-1.5">
                <CalendarCheck className="h-4 w-4" aria-hidden />
                {availability?.hoursSet ? t('bookForm.slotFree') : t('common.hoursNotSet')}
              </span>
            </Alert>
          )}
          {slotState === 'busy' && (
            <Alert tone="warning">
              <span className="inline-flex items-center gap-1.5">
                <CalendarX2 className="h-4 w-4" aria-hidden />
                {t('bookForm.slotOutside')}
              </span>
            </Alert>
          )}
        </>
      )}

      {current === 'where' && (
        <>
          <TextField label={t('bookForm.house')} value={address.house} error={errors['address.house']} required maxLength={200} autoComplete="address-line1" onChange={(e) => setAddress({ ...address, house: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label={t('common.locality')} value={address.locality} error={errors['address.locality']} required maxLength={150} onChange={(e) => setAddress({ ...address, locality: e.target.value })} />
            <TextField label={t('common.city')} value={address.city} error={errors['address.city']} required maxLength={100} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
            <TextField label={t('bookForm.pincode')} inputMode="numeric" maxLength={6} value={address.pincode} error={errors['address.pincode']} optional autoComplete="postal-code" onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
            <TextField label={t('bookForm.landmark')} value={address.landmark} optional maxLength={200} onChange={(e) => setAddress({ ...address, landmark: e.target.value })} />
          </div>
          <p className="text-sm text-stone-600">{t('bookForm.addressPrivacy')}</p>
        </>
      )}

      {current === 'price' && (
        <>
          <ChoiceGroup<PriceType>
            legend={t('bookForm.priceType')}
            value={priceType}
            onChange={setPriceType}
            columns={3}
            options={[
              { value: 'visit', label: t('price.visit') },
              { value: 'hourly', label: t('price.hourly') },
              { value: 'fixed', label: t('price.fixed') },
            ]}
          />
          <TextField label={t('bookForm.indicativeAmount')} type="number" min={0} inputMode="numeric" value={amount} optional onChange={(e) => setAmount(e.target.value)} hint={t('bookForm.priceHint')} />
          <ChoiceGroup
            legend={t('bookForm.payment')}
            value={payment}
            onChange={setPayment}
            columns={2}
            options={[
              { value: 'cash_on_completion', label: t('bookForm.cash') },
              { value: 'upi_direct', label: t('bookForm.upi') },
            ]}
          />
        </>
      )}

      {current === 'review' && (
        <dl className="divide-y divide-stone-200 rounded-lg border border-stone-200 text-sm">
          {[
            [t('bookForm.serviceTitle'), serviceTitle],
            [t('bookForm.describe'), description],
            [t('booking.when'), `${slot.date}, ${new Date(slotToIso(slot)).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' })} · ${slot.durationMinutes < 60 ? t('common.minutes', { n: slot.durationMinutes }) : t('common.hours', { n: slot.durationMinutes / 60 })}`],
            [t('booking.where'), [address.house, address.locality, address.city, address.pincode].filter(Boolean).join(', ')],
            [t('price.indicative'), `${tk('price', priceType)}${amount ? ` · ${formatMoney(Number(amount))}` : ''}`],
          ].map(([k, v]) => (
            <div key={k} className="grid gap-1 p-3 sm:grid-cols-[160px_1fr]">
              <dt className="font-semibold text-stone-700">{k}</dt>
              <dd className="whitespace-pre-wrap break-words text-stone-900">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {current === 'review' && <p className="text-sm text-stone-600">{t('bookForm.priceHint')}</p>}

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="secondary" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || busy}>
          {t('common.back')}
        </Button>
        <Button type="submit" loading={busy}>
          {current === 'review' ? (busy ? t('bookForm.sending') : t('bookForm.send')) : t('common.next')}
        </Button>
      </div>
    </form>
  );
}
