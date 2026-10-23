'use client';

import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { cn } from '@/lib/utils';

export default function LanguageSwitch({ className }: { className?: string }) {
  const { lang, t } = useI18n();
  const { setLanguage } = useSession();
  return (
    <div role="group" aria-label={t('common.language')} className={cn('inline-flex rounded-lg border border-stone-300 bg-white p-0.5', className)}>
      {(['en', 'hi'] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={lang === l}
          onClick={() => setLanguage(l)}
          className={cn('min-h-[36px] rounded-md px-2.5 text-sm font-semibold', lang === l ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100')}
        >
          {l === 'en' ? 'English' : 'हिन्दी'}
        </button>
      ))}
    </div>
  );
}

/** Compact one-tap toggle for narrow screens: shows the language you can switch to. */
export function LanguageToggle({ className }: { className?: string }) {
  const { lang } = useI18n();
  const { setLanguage } = useSession();
  const other = lang === 'en' ? 'hi' : 'en';
  return (
    <button
      type="button"
      lang={other}
      onClick={() => setLanguage(other)}
      className={cn('min-h-[40px] rounded-lg border border-stone-300 bg-white px-2.5 text-sm font-semibold text-stone-800', className)}
    >
      {other === 'hi' ? 'हिन्दी' : 'English'}
    </button>
  );
}
