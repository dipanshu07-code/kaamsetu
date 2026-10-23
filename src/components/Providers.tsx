'use client';

import React from 'react';
import { I18nProvider, Lang } from '@/lib/i18n';
import { SessionProvider } from '@/lib/session';

export default function Providers({ initialLang, children }: { initialLang: Lang; children: React.ReactNode }) {
  return (
    <I18nProvider initialLang={initialLang}>
      <SessionProvider>{children}</SessionProvider>
    </I18nProvider>
  );
}
