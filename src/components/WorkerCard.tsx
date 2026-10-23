'use client';

import Link from 'next/link';
import { CalendarX2, CalendarCheck, MapPin, CircleDashed } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Avatar, IndicativeRates, Rating, VerificationBadge } from './domain';
import { Badge } from './ui';

export interface WorkerSummary {
  id: string;
  fullName: string;
  fullNameHi: string | null;
  avatarUrl: string | null;
  category: string;
  experienceYears: number;
  locality: string;
  city: string;
  headline: string | null;
  skills: string[];
  verificationStatus: string;
  rating: number | null;
  reviewCount: number;
  completedJobsCount: number;
  isDemoProfile: boolean;
  isAvailableToday: boolean;
  hourlyRate: number | null;
  visitCharge: number | null;
  baseRate: number | null;
  pricingBasis: string;
  distanceKm: number | null;
  slot: 'available' | 'unavailable' | 'hours_not_set' | null;
}

/** Distances are approximate (area centre to area centre), so very small values read as "under 1 km". */
export function distanceLabel(t: (k: 'common.aboutKm' | 'common.underOneKm', v?: Record<string, number>) => string, km: number) {
  return km < 1 ? t('common.underOneKm') : t('common.aboutKm', { n: km });
}

export default function WorkerCard({ w, bookHref }: { w: WorkerSummary; bookHref?: string }) {
  const { t, tk, lang } = useI18n();
  const name = lang === 'hi' && w.fullNameHi ? w.fullNameHi : w.fullName;
  return (
    <article className="card flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <Avatar src={w.avatarUrl} name={w.fullName} size={56} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-stone-900">
            <Link href={`/workers/${w.id}`} className="hover:underline">
              {name}
            </Link>
          </h3>
          <p className="text-sm text-stone-700">
            {tk('cat', w.category)} · {t('common.years', { n: w.experienceYears })}
          </p>
          <p className="mt-0.5 flex items-start gap-1 text-sm text-stone-600">
            <MapPin className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden />
            <span>
              {w.locality}, {w.city}
              {w.distanceKm !== null && <span className="block">{distanceLabel(t, w.distanceKm)}</span>}
            </span>
          </p>
        </div>
      </div>

      {w.headline && <p className="text-sm text-stone-800">{w.headline}</p>}

      <div className="flex flex-wrap gap-1.5">
        <VerificationBadge status={w.verificationStatus} />
        {w.slot === 'available' && <Badge tone="green" icon={CalendarCheck}>{t('common.availableAtThisTime')}</Badge>}
        {w.slot === 'unavailable' && <Badge tone="neutral" icon={CalendarX2}>{t('common.unavailableAtThisTime')}</Badge>}
        {w.slot === 'hours_not_set' && <Badge tone="neutral" icon={CircleDashed}>{t('common.hoursNotSet')}</Badge>}
        {w.isDemoProfile && <Badge tone="amber">{t('common.demoProfile')}</Badge>}
      </div>

      <IndicativeRates w={w} />
      <Rating rating={w.rating} count={w.reviewCount} />

      <div className="mt-auto flex gap-2 pt-1">
        <Link href={`/workers/${w.id}`} className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 hover:bg-stone-50">
          {t('workers.viewProfile')}
        </Link>
        {bookHref && w.slot !== 'unavailable' && (
          <Link href={bookHref} className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-brand-700 px-3 text-sm font-semibold text-white hover:bg-brand-800">
            {t('workers.book')}
          </Link>
        )}
      </div>
    </article>
  );
}
