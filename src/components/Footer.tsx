'use client';

import Link from 'next/link';
import { useI18n, MessageKey } from '@/lib/i18n';

const columns: { title: MessageKey; links: { href: string; key: MessageKey }[] }[] = [
  {
    title: 'footer.forCustomers',
    links: [
      { href: '/requests/new', key: 'nav.getRepair' },
      { href: '/workers', key: 'nav.findWorkers' },
      { href: '/how-it-works', key: 'nav.howItWorks' },
      { href: '/cancellation-policy', key: 'nav.cancellationPolicy' },
    ],
  },
  {
    title: 'footer.forWorkers',
    links: [
      { href: '/worker/register', key: 'nav.becomeWorker' },
      { href: '/jobs', key: 'nav.jobs' },
      { href: '/worker/verification', key: 'nav.verification' },
    ],
  },
  {
    title: 'footer.forEmployers',
    links: [
      { href: '/signup?role=employer', key: 'nav.signup' },
      { href: '/employer/jobs/new', key: 'nav.postJob' },
    ],
  },
  {
    title: 'footer.support',
    links: [
      { href: '/grievance', key: 'nav.grievance' },
      { href: '/privacy', key: 'nav.privacy' },
      { href: '/about', key: 'nav.about' },
      { href: '/blueprint', key: 'nav.blueprint' },
    ],
  },
];

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-16 border-t border-stone-200 bg-white">
      <div className="container-page grid gap-8 py-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="space-y-3">
          <p className="text-lg font-bold text-stone-900">{t('common.brand')}</p>
          <p className="text-sm text-stone-600">{t('footer.about')}</p>
          <p className="text-sm text-stone-600">{t('footer.honesty')}</p>
        </div>
        {columns.map((c) => (
          <div key={c.title}>
            <h2 className="mb-2 text-sm font-semibold text-stone-900">{t(c.title)}</h2>
            <ul className="space-y-1.5">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-stone-700 hover:text-brand-800 hover:underline">
                    {t(l.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-stone-200 py-4 text-center text-xs text-stone-500">{t('footer.rights', { year: new Date().getFullYear() })}</div>
    </footer>
  );
}
