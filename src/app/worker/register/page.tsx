'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import SignupForm from '@/components/forms/SignupForm';

/** Worker onboarding (kept at its original URL). Supports assisted onboarding. */
export default function WorkerRegisterPage() {
  const { t } = useI18n();
  return (
    <div className="container-page max-w-xl py-10">
      <h1 className="text-2xl font-bold text-stone-900">{t('auth.workerRegisterTitle')}</h1>
      <p className="mt-2 flex items-start gap-2 text-stone-700">
        <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-stone-700" aria-hidden />
        {t('auth.workerRegisterSubtitle')}
      </p>
      <div className="mt-6">
        <SignupForm initialRole="worker" lockRole />
      </div>
      <p className="mt-4 text-center text-sm text-stone-700">
        {t('auth.haveAccount')}{' '}
        <Link href="/login" className="link">
          {t('nav.login')}
        </Link>
      </p>
    </div>
  );
}
