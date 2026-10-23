'use client';

import { useI18n } from '@/lib/i18n';
import ProsePage from '@/components/ProsePage';
import { LinkButton } from '@/components/ui';

export default function CancellationPolicyPage() {
  const { t } = useI18n();
  return (
    <ProsePage
      title="cancel.title"
      intro={['cancel.updated']}
      sections={[
        { title: 'cancel.customerTitle', items: ['cancel.customer1', 'cancel.customer2', 'cancel.customer3'] },
        { title: 'cancel.workerTitle', items: ['cancel.worker1', 'cancel.worker2'] },
        { title: 'cancel.afterTitle', items: ['cancel.after1', 'cancel.after2', 'cancel.after3'] },
        { title: 'cancel.paymentTitle', items: ['cancel.payment'] },
      ]}
    >
      <div className="mt-8">
        <LinkButton href="/grievance" variant="secondary">{t('nav.grievance')}</LinkButton>
      </div>
    </ProsePage>
  );
}
