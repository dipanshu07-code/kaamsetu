'use client';

import React from 'react';
import { useI18n, MessageKey } from '@/lib/i18n';

/** Simple translated long-form page: a title plus sections of paragraphs or bullet lists. */
export default function ProsePage({
  title,
  intro,
  sections,
  children,
}: {
  title: MessageKey;
  intro?: MessageKey[];
  sections: { title: MessageKey; items: MessageKey[]; list?: 'ul' | 'ol' }[];
  children?: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-3xl font-bold tracking-tight text-stone-900">{t(title)}</h1>
      {intro?.map((k) => (
        <p key={k} className="mt-3 text-lg text-stone-700">
          {t(k)}
        </p>
      ))}
      <div className="mt-8 space-y-8">
        {sections.map((s) => {
          const List = s.list === 'ol' ? 'ol' : 'ul';
          return (
            <section key={s.title}>
              <h2 className="text-xl font-semibold text-stone-900">{t(s.title)}</h2>
              {s.items.length === 1 ? (
                <p className="mt-2 text-stone-800">{t(s.items[0])}</p>
              ) : (
                <List className={`mt-2 space-y-2 pl-5 text-stone-800 ${s.list === 'ol' ? 'list-decimal' : 'list-disc'}`}>
                  {s.items.map((k) => (
                    <li key={k}>{t(k)}</li>
                  ))}
                </List>
              )}
            </section>
          );
        })}
      </div>
      {children}
    </div>
  );
}
