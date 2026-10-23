'use client';

import { useI18n } from '@/lib/i18n';
import { EmptyState, LinkButton } from '@/components/ui';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="container-page py-16">
      <EmptyState title={t('misc.notFoundTitle')} text={t('misc.notFoundText')} action={<LinkButton href="/">{t('misc.goHome')}</LinkButton>} />
    </div>
  );
}
