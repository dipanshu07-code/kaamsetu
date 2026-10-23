'use client';

import Link from 'next/link';
import { Briefcase, Building2, Wrench } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { LinkButton, useLoad } from '@/components/ui';

interface Category {
  slug: string;
  isEnabled: boolean;
  startingPrice: number;
  priceUnit: string;
}

export default function HomePage() {
  const { t, tk, formatMoney } = useI18n();
  const { data } = useLoad(() => api.get<{ categories: Category[] }>('/api/categories'), []);

  return (
    <div>
      <section className="border-b border-stone-200 bg-white">
        <div className="container-page py-10 sm:py-14">
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">{t('home.title')}</h1>
          <p className="mt-3 max-w-2xl text-lg text-stone-700">{t('home.subtitle')}</p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="flex flex-col rounded-xl border-2 border-brand-700 bg-brand-50/40 p-5">
              <Wrench className="h-7 w-7 text-brand-800" aria-hidden />
              <h2 className="mt-3 text-xl font-bold text-stone-900">{t('home.needRepair')}</h2>
              <p className="mt-1 flex-1 text-stone-700">{t('home.needRepairText')}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <LinkButton href="/requests/new">{t('home.needRepairCta')}</LinkButton>
                <Link href="/workers" className="link text-sm">
                  {t('home.browseWorkers')}
                </Link>
              </div>
            </div>
            <div className="flex flex-col rounded-xl border border-stone-300 bg-white p-5">
              <Briefcase className="h-7 w-7 text-stone-800" aria-hidden />
              <h2 className="mt-3 text-xl font-bold text-stone-900">{t('home.findJob')}</h2>
              <p className="mt-1 flex-1 text-stone-700">{t('home.findJobText')}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <LinkButton href="/jobs" variant="secondary">
                  {t('home.findJobCta')}
                </LinkButton>
                <Link href="/worker/register" className="link text-sm">
                  {t('home.joinWorker')}
                </Link>
              </div>
            </div>
          </div>
          <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-stone-700">
            <Building2 className="h-4 w-4" aria-hidden />
            {t('home.hiringText')}
            <Link href="/signup?role=employer" className="link">
              {t('home.hiringCta')}
            </Link>
          </p>
        </div>
      </section>

      <section className="container-page py-10">
        <h2 className="text-xl font-bold text-stone-900">{t('home.categories')}</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.categories || []).map((c) => (
            <li key={c.slug}>
              <Link
                href={c.slug === 'construction' ? '/jobs?trade=construction' : `/requests/new?category=${c.slug}`}
                className="flex min-h-[56px] items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-3 hover:border-stone-400"
              >
                <span className="font-semibold text-stone-900">{tk('cat', c.slug)}</span>
                <span className="text-sm text-stone-600">
                  {formatMoney(c.startingPrice)}+ {tk('price.basis', c.priceUnit)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page grid gap-8 pb-4 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold text-stone-900">{t('home.howTitle')}</h2>
          <ol className="mt-4 space-y-3">
            {(['home.how1', 'home.how2', 'home.how3', 'home.how4'] as const).map((k, i) => (
              <li key={k} className="flex gap-3">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-stone-900 text-sm font-bold text-white">{i + 1}</span>
                <span className="pt-0.5 text-stone-800">{t(k)}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="text-xl font-bold text-stone-900">{t('home.trustTitle')}</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-stone-800">
            {(['home.trust1', 'home.trust2', 'home.trust3', 'home.trust4'] as const).map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
