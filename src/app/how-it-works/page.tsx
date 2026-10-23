'use client';

import { useI18n } from '@/lib/i18n';
import ProsePage from '@/components/ProsePage';
import { LinkButton } from '@/components/ui';

export default function HowItWorksPage() {
  const { t } = useI18n();
  return (
    <ProsePage
      title="how.title"
      intro={['how.subtitle']}
      sections={[
        { title: 'how.repairTitle', items: ['how.repair1', 'how.repair2', 'how.repair3', 'how.repair4', 'how.repair5'], list: 'ol' },
        { title: 'how.jobsTitle', items: ['how.jobs1', 'how.jobs2', 'how.jobs3'], list: 'ol' },
        { title: 'how.workersTitle', items: ['how.workers1', 'how.workers2', 'how.workers3'] },
      ]}
    >
      <div id="workers" className="mt-10 flex flex-wrap gap-2">
        <LinkButton href="/requests/new">{t('nav.getRepair')}</LinkButton>
        <LinkButton href="/jobs" variant="secondary">{t('nav.jobs')}</LinkButton>
        <LinkButton href="/worker/register" variant="secondary">{t('nav.becomeWorker')}</LinkButton>
      </div>
    </ProsePage>
  );
}
