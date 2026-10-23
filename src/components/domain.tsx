'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Ban,
  CalendarCheck,
  CheckCircle2,
  CircleDashed,
  Clock,
  Hammer,
  Hourglass,
  LocateFixed,
  ShieldAlert,
  ShieldCheck,
  Star,
  User,
  XCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { istDate } from '@/lib/domain';
import { Badge, SelectField, TextField, Checkbox } from './ui';
import { cn } from '@/lib/utils';

export interface Locality {
  id: string;
  name: string;
  nameHi: string | null;
  city: string;
  hasCoordinates: boolean;
}

// ---------------------------------------------------------------------------
// Status badges always pair colour with an icon and text.
// ---------------------------------------------------------------------------
const bookingStatusStyle: Record<string, { tone: 'neutral' | 'orange' | 'green' | 'amber' | 'red'; icon: any }> = {
  pending: { tone: 'amber', icon: Hourglass },
  accepted: { tone: 'orange', icon: Clock },
  confirmed: { tone: 'green', icon: CalendarCheck },
  in_progress: { tone: 'orange', icon: Hammer },
  completed: { tone: 'green', icon: CheckCircle2 },
  declined: { tone: 'neutral', icon: XCircle },
  cancelled: { tone: 'neutral', icon: Ban },
  expired: { tone: 'neutral', icon: CircleDashed },
  disputed: { tone: 'red', icon: ShieldAlert },
};

export function BookingStatusBadge({ status }: { status: string }) {
  const { tk } = useI18n();
  const s = bookingStatusStyle[status] || bookingStatusStyle.pending;
  return (
    <Badge tone={s.tone} icon={s.icon}>
      {tk('status', status)}
    </Badge>
  );
}

export function VerificationBadge({ status }: { status: string }) {
  const { tk } = useI18n();
  if (status === 'verified') return <Badge tone="green" icon={ShieldCheck}>{tk('verifyStatus', status)}</Badge>;
  if (status === 'pending') return <Badge tone="amber" icon={Hourglass}>{tk('verifyStatus', status)}</Badge>;
  return <Badge tone="neutral" icon={CircleDashed}>{tk('verifyStatus', 'unverified')}</Badge>;
}

export function Avatar({ src, name, size = 48 }: { src?: string | null; name: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <span
        aria-hidden
        style={{ width: size, height: size }}
        className="flex flex-none items-center justify-center rounded-full bg-stone-200 font-semibold text-stone-700"
      >
        {name.trim().charAt(0).toUpperCase() || <User className="h-5 w-5" />}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={size} height={size} onError={() => setBroken(true)} style={{ width: size, height: size }} className="flex-none rounded-full object-cover" />
  );
}

export function Rating({ rating, count }: { rating: number | null; count: number }) {
  const { t } = useI18n();
  if (!count || rating === null) return <span className="text-sm text-stone-600">{t('common.noReviewsYet')}</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm text-stone-800">
      <Star className="h-4 w-4 fill-brand-600 text-brand-600" aria-hidden />
      <span className="font-semibold">{rating.toFixed(1)}</span>
      <span className="text-stone-600">({t('common.reviews', { n: count })})</span>
    </span>
  );
}

export function PriceTypeLabel({ type }: { type: string | null }) {
  const { tk } = useI18n();
  return <>{type ? tk('price', type) : ''}</>;
}

/** Shows the indicative rates a worker publishes. */
export function IndicativeRates({ w }: { w: { hourlyRate: number | null; visitCharge: number | null; baseRate: number | null; pricingBasis: string } }) {
  const { t, tk, formatMoney } = useI18n();
  const parts: string[] = [];
  if (w.visitCharge) parts.push(`${formatMoney(w.visitCharge)} ${t('common.perVisit')}`);
  if (w.hourlyRate) parts.push(`${formatMoney(w.hourlyRate)} ${t('common.perHour')}`);
  if (!parts.length && w.baseRate) parts.push(`${formatMoney(w.baseRate)} ${tk('price.basis', w.pricingBasis)}`);
  if (!parts.length) return null;
  return (
    <p className="text-sm text-stone-800">
      <span className="text-stone-600">{t('price.indicative')}: </span>
      <span className="font-semibold">{parts.join(' · ')}</span>
    </p>
  );
}

// ---------------------------------------------------------------------------
// Locality picker with manual fallback and optional browser location
// ---------------------------------------------------------------------------
let localityCache: Promise<Locality[]> | null = null;
export function useLocalities() {
  const [list, setList] = useState<Locality[]>([]);
  useEffect(() => {
    if (!localityCache) localityCache = api.get<{ localities: Locality[] }>('/api/localities').then((r) => r.localities).catch(() => ((localityCache = null), []));
    localityCache.then(setList);
  }, []);
  return list;
}

export interface LocalityValue {
  localityId: string | null;
  localityText: string;
  city: string;
}

export function LocalityPicker({
  value,
  onChange,
  error,
  label,
  allowFreeText = true,
}: {
  value: LocalityValue;
  onChange: (v: LocalityValue) => void;
  error?: string | null;
  label?: string;
  allowFreeText?: boolean;
}) {
  const { t, tk, lang } = useI18n();
  const localities = useLocalities();
  const cities = useMemo(() => Array.from(new Set(localities.map((l) => l.city))), [localities]);
  const [manual, setManual] = useState(false);
  const inCity = localities.filter((l) => !value.city || l.city === value.city);

  useEffect(() => {
    if (value.localityText && !value.localityId) setManual(true);
  }, [value.localityId, value.localityText]);

  return (
    <div className="space-y-3">
      <SelectField
        label={t('common.city')}
        value={value.city}
        onChange={(e) => onChange({ localityId: null, localityText: '', city: e.target.value })}
        required
      >
        <option value="">—</option>
        {cities.map((c) => (
          <option key={c} value={c}>
            {tk('city', c)}
          </option>
        ))}
      </SelectField>
      {!manual ? (
        <SelectField
          label={label || t('common.locality')}
          value={value.localityId || ''}
          error={error}
          onChange={(e) => {
            const l = localities.find((x) => x.id === e.target.value);
            onChange({ localityId: l?.id || null, localityText: l?.name || '', city: l?.city || value.city });
          }}
          required
          disabled={!value.city}
        >
          <option value="">{t('common.chooseLocality')}</option>
          {inCity.map((l) => (
            <option key={l.id} value={l.id}>
              {lang === 'hi' && l.nameHi ? `${l.nameHi} (${l.name})` : l.name}
            </option>
          ))}
        </SelectField>
      ) : (
        <TextField
          label={label || t('common.typeLocality')}
          value={value.localityText}
          error={error}
          maxLength={150}
          required
          onChange={(e) => onChange({ localityId: null, localityText: e.target.value, city: value.city })}
        />
      )}
      {allowFreeText && (
        <Checkbox
          label={t('common.otherLocality')}
          checked={manual}
          onChange={(e) => {
            setManual(e.target.checked);
            onChange({ localityId: null, localityText: '', city: value.city });
          }}
        />
      )}
    </div>
  );
}

/** Asks for browser location only when the user taps the button. Rounded to ~1 km; never stored. */
export function UseMyLocation({ onLocated, active }: { onLocated: (c: { lat: number; lng: number } | null) => void; active: boolean }) {
  const { t } = useI18n();
  const [status, setStatus] = useState<'idle' | 'busy' | 'denied'>('idle');
  return (
    <div className="space-y-1">
      <button
        type="button"
        className={cn('inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-3 text-sm font-semibold', active ? 'border-brand-700 bg-brand-50 text-brand-900' : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-50')}
        aria-pressed={active}
        onClick={() => {
          if (active) return onLocated(null);
          if (!('geolocation' in navigator)) return setStatus('denied');
          setStatus('busy');
          navigator.geolocation.getCurrentPosition(
            (p) => {
              setStatus('idle');
              onLocated({ lat: Math.round(p.coords.latitude * 100) / 100, lng: Math.round(p.coords.longitude * 100) / 100 });
            },
            () => setStatus('denied'),
            { timeout: 10_000, maximumAge: 600_000 },
          );
        }}
      >
        <LocateFixed className="h-4 w-4" aria-hidden />
        {active ? t('common.locationUsed') : t('common.useMyLocation')}
      </button>
      <p className="text-xs text-stone-600">{status === 'denied' ? t('common.locationDenied') : t('common.locationOptional')}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Date + start time + duration (IST)
// ---------------------------------------------------------------------------
export interface SlotValue {
  date: string;
  startMinute: number;
  durationMinutes: number;
}

export function defaultSlot(): SlotValue {
  return { date: istDate(new Date(Date.now() + 86400_000)), startMinute: 10 * 60, durationMinutes: 60 };
}

export function slotToIso(s: SlotValue) {
  const hh = String(Math.floor(s.startMinute / 60)).padStart(2, '0');
  const mm = String(s.startMinute % 60).padStart(2, '0');
  return new Date(`${s.date}T${hh}:${mm}:00+05:30`).toISOString();
}

export function TimeOptions() {
  const opts = [];
  for (let m = 6 * 60; m <= 21 * 60; m += 30) {
    const h = Math.floor(m / 60);
    const label = `${h % 12 === 0 ? 12 : h % 12}:${String(m % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
    opts.push(
      <option key={m} value={m}>
        {label}
      </option>,
    );
  }
  return <>{opts}</>;
}

export function SlotPicker({ value, onChange, showDuration = true }: { value: SlotValue; onChange: (v: SlotValue) => void; showDuration?: boolean }) {
  const { t } = useI18n();
  const today = istDate(new Date());
  const max = istDate(new Date(Date.now() + 89 * 86400_000));
  return (
    <div className={cn('grid gap-3', showDuration ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
      <TextField label={t('workers.date')} type="date" min={today} max={max} value={value.date} required onChange={(e) => onChange({ ...value, date: e.target.value })} />
      <SelectField label={t('workers.startTime')} value={value.startMinute} onChange={(e) => onChange({ ...value, startMinute: Number(e.target.value) })}>
        <TimeOptions />
      </SelectField>
      {showDuration && (
        <SelectField label={t('workers.duration')} value={value.durationMinutes} onChange={(e) => onChange({ ...value, durationMinutes: Number(e.target.value) })}>
          {[30, 60, 90, 120, 180, 240, 360, 480].map((m) => (
            <option key={m} value={m}>
              {m < 60 ? t('common.minutes', { n: m }) : t('common.hours', { n: m / 60 })}
            </option>
          ))}
        </SelectField>
      )}
    </div>
  );
}

export function StarInput({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  const { t } = useI18n();
  const name = React.useId();
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-semibold text-stone-800">{label}</legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer">
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} className="peer sr-only" />
            <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-stone-300 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-brand-700 peer-checked:border-brand-700">
              <Star className={cn('h-6 w-6', n <= value ? 'fill-brand-600 text-brand-600' : 'text-stone-400')} aria-hidden />
              <span className="sr-only">{t('review.stars', { n })}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function CategoryName({ slug }: { slug: string | null | undefined }) {
  const { tk } = useI18n();
  return <>{slug ? tk('cat', slug) : ''}</>;
}

/** Booking title: request-based bookings are titled by their (translated) service category. */
export function useBookingTitle() {
  const { tk } = useI18n();
  return (b: { serviceTitle: string; category: string; serviceRequestId?: string | null }) => (b.serviceRequestId ? tk('cat', b.category) : b.serviceTitle);
}
