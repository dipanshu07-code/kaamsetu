'use client';

import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { PageHeader, RequireRole } from '@/components/ui';
import JobForm, { emptyJob } from '@/components/forms/JobForm';

function NewJob() {
  const { t } = useI18n();
  const { user } = useSession();
  const router = useRouter();
  return (
    <>
      <PageHeader title={t('emp.formTitle')} />
      <JobForm
        initial={emptyJob}
        initialLocation={{ localityId: user?.localityId || null, localityText: user?.locality || '', city: user?.city || '' }}
        onSaved={(id) => router.push(`/employer/jobs/${id}?published=1`)}
      />
    </>
  );
}

export default function NewJobPage() {
  return (
    <RequireRole roles={['employer']}>
      <div className="container-page max-w-3xl py-8">
        <NewJob />
      </div>
    </RequireRole>
  );
}
