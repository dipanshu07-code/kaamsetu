'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Menu, MessageSquare, X } from 'lucide-react';
import { useI18n, MessageKey } from '@/lib/i18n';
import { dashboardPath, useSession } from '@/lib/session';
import { cn } from '@/lib/utils';
import LanguageSwitch, { LanguageToggle } from './LanguageSwitch';

type NavItem = { href: string; key: MessageKey };

function navFor(role: string | undefined): NavItem[] {
  switch (role) {
    case 'customer':
      return [
        { href: '/requests/new', key: 'nav.getRepair' },
        { href: '/workers', key: 'nav.findWorkers' },
        { href: '/customer/dashboard', key: 'nav.dashboard' },
      ];
    case 'worker':
      return [
        { href: '/worker/alerts', key: 'nav.workerAlerts' },
        { href: '/worker/schedule', key: 'nav.schedule' },
        { href: '/jobs', key: 'nav.jobs' },
        { href: '/worker/dashboard', key: 'nav.dashboard' },
      ];
    case 'employer':
      return [
        { href: '/employer/jobs/new', key: 'nav.postJob' },
        { href: '/employer/dashboard', key: 'nav.employerJobs' },
        { href: '/workers', key: 'nav.findWorkers' },
      ];
    case 'admin':
      return [
        { href: '/admin', key: 'nav.admin' },
        { href: '/workers', key: 'nav.findWorkers' },
        { href: '/jobs', key: 'nav.jobs' },
      ];
    default:
      return [
        { href: '/requests/new', key: 'nav.getRepair' },
        { href: '/workers', key: 'nav.findWorkers' },
        { href: '/jobs', key: 'nav.jobs' },
        { href: '/how-it-works', key: 'nav.howItWorks' },
      ];
  }
}

function secondaryFor(role: string | undefined): NavItem[] {
  switch (role) {
    case 'customer':
      return [
        { href: '/jobs', key: 'nav.jobs' },
        { href: '/grievance', key: 'nav.grievance' },
        { href: '/account', key: 'nav.account' },
      ];
    case 'worker':
      return [
        { href: '/worker/profile', key: 'nav.myProfile' },
        { href: '/worker/applications', key: 'nav.applications' },
        { href: '/worker/verification', key: 'nav.verification' },
        { href: '/grievance', key: 'nav.grievance' },
        { href: '/account', key: 'nav.account' },
      ];
    case 'employer':
      return [
        { href: '/jobs', key: 'nav.jobs' },
        { href: '/grievance', key: 'nav.grievance' },
        { href: '/account', key: 'nav.account' },
      ];
    case 'admin':
      return [{ href: '/account', key: 'nav.account' }];
    default:
      return [
        { href: '/worker/register', key: 'nav.becomeWorker' },
        { href: '/about', key: 'nav.about' },
        { href: '/grievance', key: 'nav.grievance' },
      ];
  }
}

function CountBadge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-brand-700 px-1 text-center text-[11px] font-bold leading-[18px] text-white">
      {n > 9 ? '9+' : n}
    </span>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const { user, logout } = useSession();
  const [open, setOpen] = useState(false);
  const items = navFor(user?.role);
  const more = secondaryFor(user?.role);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href + '/'));
  const doLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link href={user ? dashboardPath(user.role) : '/'} className="flex items-center gap-2" aria-label={t('common.brand')}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-900 text-sm font-bold text-white" aria-hidden>
            KS
          </span>
          <span className="text-lg font-bold tracking-tight text-stone-900">{t('common.brand')}</span>
        </Link>

        <nav aria-label={t('nav.main')} className="hidden items-center gap-1 lg:flex">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              aria-current={isActive(i.href) ? 'page' : undefined}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-semibold',
                isActive(i.href) ? 'bg-brand-50 text-brand-900' : 'text-stone-700 hover:bg-stone-100',
              )}
            >
              {t(i.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitch className="hidden sm:inline-flex" />
          <LanguageToggle className="sm:hidden" />
          {user && (
            <>
              <Link href="/messages" className="relative rounded-lg p-2 text-stone-700 hover:bg-stone-100" aria-label={t('nav.messages')}>
                <MessageSquare className="h-5 w-5" aria-hidden />
                <CountBadge n={user.unreadConversations} />
              </Link>
              <Link href="/notifications" className="relative rounded-lg p-2 text-stone-700 hover:bg-stone-100" aria-label={t('nav.notifications')}>
                <Bell className="h-5 w-5" aria-hidden />
                <CountBadge n={user.unreadNotifications} />
              </Link>
            </>
          )}
          {!user && (
            <div className="hidden items-center gap-2 lg:flex">
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-100">
                {t('nav.login')}
              </Link>
              <Link href="/signup" className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800">
                {t('nav.signup')}
              </Link>
            </div>
          )}
          <button
            type="button"
            className="rounded-lg p-2 text-stone-800 hover:bg-stone-100"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen(!open)}
            aria-label={open ? t('nav.closeMenu') : t('nav.menu')}
          >
            {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <div id="site-menu" className="border-t border-stone-200 bg-white">
          <nav aria-label={t('nav.menu')} className="container-page grid gap-1 py-3 sm:grid-cols-2 lg:grid-cols-4">
            {[...items, ...more].map((i) => (
              <Link
                key={i.href}
                href={i.href}
                aria-current={isActive(i.href) ? 'page' : undefined}
                className={cn('rounded-lg px-3 py-3 text-base font-medium', isActive(i.href) ? 'bg-brand-50 text-brand-900' : 'text-stone-800 hover:bg-stone-100')}
              >
                {t(i.key)}
              </Link>
            ))}
            {user ? (
              <button type="button" onClick={doLogout} className="rounded-lg px-3 py-3 text-left text-base font-medium text-stone-800 hover:bg-stone-100">
                {t('nav.logout')} ({user.name})
              </button>
            ) : (
              <>
                <Link href="/login" className="rounded-lg px-3 py-3 text-base font-medium text-stone-800 hover:bg-stone-100">
                  {t('nav.login')}
                </Link>
                <Link href="/signup" className="rounded-lg px-3 py-3 text-base font-semibold text-brand-800 hover:bg-brand-50">
                  {t('nav.signup')}
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
