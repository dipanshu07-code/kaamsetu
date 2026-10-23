'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import SignupForm from '@/components/forms/SignupForm';

function Signup() {
  const { t } = useI18n();
  const r = useSearchParams().get('role');
  const role = r === 'worker' || r === 'employer' || r === 'customer' ? r : undefined;
  return (
    <div className="container-page max-w-xl py-10">
      <h1 className="mb-6 text-2xl font-bold text-stone-900">{t('auth.signupTitle')}</h1>
      <SignupForm initialRole={role} />
      <p className="mt-4 text-center text-sm text-stone-700">
        {t('auth.haveAccount')}{' '}
        <Link href="/login" className="link">
          {t('nav.login')}
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <Signup />
    </Suspense>
  );
}
