'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle2, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { istDate } from '@/lib/domain';
import { Alert, Badge, Button, EmptyState, LinkButton, LoadError, Section, Spinner, useLoad } from '@/components/ui';
import { Avatar, IndicativeRates, Rating, VerificationBadge, SlotValue, defaultSlot } from '@/components/domain';
import AvailabilityList, { Availability } from '@/components/AvailabilityList';
import BookingForm from '@/components/forms/BookingForm';
import PriceIntelligenceCard from '@/components/PriceIntelligenceCard';

interface WorkerProfile {
  id: string;
  fullName: string;
  fullNameHi: string | null;
  avatarUrl: string | null;
  category: string;
  subcategories: string[];
  experienceYears: number;
  city: string;
  locality: string;
  serviceRadiusKm: number;
  languages: string[];
  isAvailableToday: boolean;
  pricingBasis: string;
  baseRate: number | null;
  hourlyRate: number | null;
  visitCharge: number | null;
  headline: string | null;
  bio: string | null;
  bioHi: string | null;
  skills: string[];
  verificationStatus: string;
  passedChecks: string[];
  eligibleForCategory: boolean;
  rating: number | null;
  reviewCount: number;
  completedJobsCount: number;
  isDemoProfile: boolean;
  acceptsOnDemand: boolean;
  categoryEnabled: boolean;
  rateCards: { id: string; serviceTitle: string; pricingBasis: string; amount: number; description: string | null }[];
  reviews: { id: string; rating: number; comment: string | null; createdAt: string; customerFirstName: string; locality: string }[];
  experience: { id: string; roleTitle: string; employerName: string | null; locality: string | null; startMonth: string; endMonth: string | null; description: string | null }[];
  workHistory: { id: string; title: string; locality: string | null; completedOn: string | null; rating: number | null }[];
}

function Profile() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const { t, tk, lang, formatDate, formatMoney } = useI18n();
  const { user } = useSession();
  const [showBooking, setShowBooking] = useState(params.get('book') === '1');

  const { data, error, loading, reload } = useLoad(async () => {
    const [{ worker }, availability] = await Promise.all([
      api.get<{ worker: WorkerProfile }>(`/api/workers/${id}`),
      api.get<Availability>(`/api/workers/${id}/availability?days=7`).catch(() => null),
    ]);
    return { worker, availability };
  }, [id]);

  if (loading) return <Spinner />;
  if (error || !data)
    return (
      <div className="container-page py-10">
        {(error as any)?.code === 'not_found' ? <EmptyState title={t('profile.notFound')} action={<LinkButton href="/workers">{t('nav.findWorkers')}</LinkButton>} /> : <LoadError error={error} onRetry={reload} />}
      </div>
    );

  const w = data.worker;
  const name = lang === 'hi' && w.fullNameHi ? w.fullNameHi : w.fullName;
  const bio = lang === 'hi' && w.bioHi ? w.bioHi : w.bio;
  const initialSlot: SlotValue = params.get('date')
    ? { date: params.get('date')!, startMinute: Number(params.get('start')) || 600, durationMinutes: Number(params.get('duration')) || 60 }
    : defaultSlot();
  if (initialSlot.date < istDate(new Date())) initialSlot.date = defaultSlot().date;

  let bookingBlock: React.ReactNode;
  if (!w.categoryEnabled) bookingBlock = <Alert tone="warning">{t('profile.categoryPaused')}</Alert>;
  else if (!w.eligibleForCategory) bookingBlock = <Alert tone="warning">{t('profile.notEligible')}</Alert>;
  else if (!w.acceptsOnDemand) bookingBlock = <Alert>{t('profile.notTakingBookings')}</Alert>;
  else if (!user || user.role !== 'customer')
    bookingBlock = (
      <div className="space-y-2">
        <p className="text-sm text-stone-700">{t('profile.loginToBook')}</p>
        {!user && <LinkButton href={`/login?next=${encodeURIComponent(`/workers/${w.id}?book=1`)}`}>{t('nav.login')}</LinkButton>}
      </div>
    );
  else if (!showBooking) bookingBlock = <Button onClick={() => setShowBooking(true)} className="w-full">{t('profile.bookTitle', { name: w.fullName.split(' ')[0] })}</Button>;
  else bookingBlock = <BookingForm worker={w} availability={data.availability} initialSlot={initialSlot} />;

  return (
    <div className="container-page py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-5">
          <section className="card p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <Avatar src={w.avatarUrl} name={w.fullName} size={88} />
              <div className="min-w-0 flex-1 space-y-2">
                <h1 className="text-2xl font-bold text-stone-900">{name}</h1>
                <p className="text-stone-700">
                  {tk('cat', w.category)} · {t('common.years', { n: w.experienceYears })}
                </p>
                <p className="flex items-center gap-1 text-sm text-stone-600">
                  <MapPin className="h-4 w-4" aria-hidden />
                  {t('profile.serviceArea', { locality: `${w.locality}, ${w.city}`, km: w.serviceRadiusKm })}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <VerificationBadge status={w.verificationStatus} />
                  {w.isDemoProfile && <Badge tone="amber">{t('common.demoProfile')}</Badge>}
                </div>
                <Rating rating={w.rating} count={w.reviewCount} />
                {w.completedJobsCount > 0 && <p className="text-sm text-stone-700">{t('common.jobsDone', { n: w.completedJobsCount })}</p>}
              </div>
            </div>
            {w.headline && <p className="mt-4 font-medium text-stone-900">{w.headline}</p>}
            {bio && <p className="mt-2 whitespace-pre-line text-stone-800">{bio}</p>}
          </section>

          {(w.skills.length > 0 || w.languages.length > 0) && (
            <Section title={t('profile.skills')}>
              <ul className="flex flex-wrap gap-1.5">
                {Array.from(new Set([...w.subcategories, ...w.skills])).map((s) => (
                  <li key={s} className="rounded-md bg-stone-100 px-2 py-1 text-sm text-stone-800">
                    {s}
                  </li>
                ))}
              </ul>
              {w.languages.length > 0 && (
                <p className="mt-3 text-sm text-stone-700">
                  <span className="font-semibold">{t('profile.languages')}:</span> {w.languages.join(', ')}
                </p>
              )}
            </Section>
          )}

          <Section title={t('profile.rates')}>
            <IndicativeRates w={w} />
            {w.rateCards.length > 0 && (
              <ul className="mt-3 divide-y divide-stone-200 rounded-lg border border-stone-200">
                {w.rateCards.map((rc) => (
                  <li key={rc.id} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-stone-900">{rc.serviceTitle}</p>
                      {rc.description && <p className="text-sm text-stone-600">{rc.description}</p>}
                    </div>
                    <p className="whitespace-nowrap font-semibold text-stone-900">
                      {formatMoney(rc.amount)} <span className="text-sm font-normal text-stone-600">{tk('price.basis', rc.pricingBasis)}</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-sm text-stone-600">{t('profile.ratesHint')}</p>
          </Section>

          {data.availability && (
            <Section title={t('profile.availability')}>
              <AvailabilityList data={data.availability} />
              <p className="mt-2 text-sm text-stone-600">{t('profile.availabilityHint')}</p>
            </Section>
          )}

          <Section title={t('profile.checks')}>
            {w.passedChecks.length ? (
              <ul className="space-y-1.5">
                {w.passedChecks.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-stone-800">
                    <CheckCircle2 className="h-4 w-4 text-green-700" aria-hidden />
                    {tk('check', c)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-stone-700">{t('profile.noChecks')}</p>
            )}
            <p className="mt-3 text-sm text-stone-600">{t('profile.checksDisclaimer')}</p>
          </Section>

          {w.workHistory.length > 0 && (
            <Section title={t('profile.workHistory')}>
              <ul className="divide-y divide-stone-200">
                {w.workHistory.map((h) => (
                  <li key={h.id} className="py-2 text-sm">
                    <p className="font-semibold text-stone-900">{h.title}</p>
                    <p className="text-stone-600">
                      {[h.locality, h.completedOn && formatDate(h.completedOn)].filter(Boolean).join(' · ')}
                      {h.rating ? ` · ★ ${h.rating}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {w.experience.length > 0 && (
            <Section title={t('profile.experience')}>
              <ul className="space-y-3">
                {w.experience.map((e) => (
                  <li key={e.id} className="text-sm">
                    <p className="font-semibold text-stone-900">
                      {e.roleTitle}
                      {e.employerName && <span className="font-normal text-stone-700"> · {e.employerName}</span>}
                    </p>
                    <p className="text-stone-600">
                      {e.startMonth} – {e.endMonth || t('profile.present')}
                      {e.locality && ` · ${e.locality}`}
                    </p>
                    {e.description && <p className="mt-1 text-stone-800">{e.description}</p>}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title={t('profile.reviews')}>
            {w.reviews.length === 0 ? (
              <p className="text-stone-700">{t('common.noReviewsYet')}</p>
            ) : (
              <ul className="divide-y divide-stone-200">
                {w.reviews.map((r) => (
                  <li key={r.id} className="py-3 text-sm">
                    <p className="font-semibold text-stone-900">
                      ★ {r.rating} · {r.customerFirstName}, {r.locality}
                    </p>
                    {r.comment && <p className="mt-1 text-stone-800">{r.comment}</p>}
                    <p className="mt-1 text-stone-500">{formatDate(r.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <section className="card p-5" aria-label={t('profile.bookTitle', { name: w.fullName })}>
            <h2 className="mb-3 text-lg font-semibold text-stone-900">{t('profile.bookTitle', { name: w.fullName.split(' ')[0] })}</h2>
            {bookingBlock}
          </section>
          <PriceIntelligenceCard categorySlug={w.category} />
          <p className="text-sm text-stone-600">
            <Link href={`/requests/new?category=${w.category}`} className="link">
              {t('workers.postRequest')}
            </Link>
          </p>
        </aside>
      </div>
    </div>
  );
}

export default function WorkerProfilePage() {
  return (
    <Suspense>
      <Profile />
    </Suspense>
  );
}
