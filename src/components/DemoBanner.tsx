'use client';

import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/session';

/** Shown only when the server runs with labelled demo data. */
export default function DemoBanner() {
  const { config } = useSession();
  const { t } = useI18n();
  if (!config?.demoMode) return null;
  return (
    <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
      {t('demo.banner', { password: config.demoPassword || '' })}
    </div>
  );
}
