'use client';

import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { EmptyState, LoadError, PageHeader, RequireRole, Spinner, useLoad } from '@/components/ui';
import { useSystemText } from '@/components/ChatPanel';
import { cn } from '@/lib/utils';

interface ConversationRow {
  id: string;
  otherName: string | null;
  context: { type: 'booking' | 'request' | 'application'; title: string | null; titleIsCategory: boolean };
  lastMessage: { kind: 'text' | 'system' | 'offer'; body: string; params: any; mine: boolean; at: string } | null;
  unread: boolean;
}

function Inbox() {
  const { t, tk, formatDateTime } = useI18n();
  const sysText = useSystemText();
  const { data, error, loading, reload } = useLoad(() => api.get<{ conversations: ConversationRow[] }>('/api/conversations').then((r) => r.conversations), []);
  if (loading) return <Spinner />;
  if (error) return <LoadError error={error} onRetry={reload} />;
  if (!data?.length) return <EmptyState icon={MessageSquare} title={t('chat.empty')} />;
  return (
    <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
      {data.map((c) => (
        <li key={c.id}>
          <Link href={`/messages/${c.id}`} className="block p-4 hover:bg-stone-50">
            <div className="flex items-start justify-between gap-3">
              <p className={cn('text-stone-900', c.unread ? 'font-bold' : 'font-semibold')}>
                {c.otherName || '—'}
                {c.unread && <span className="ml-2 inline-block h-2.5 w-2.5 rounded-full bg-brand-700 align-middle" aria-label="unread" />}
              </p>
              {c.lastMessage && <time className="flex-none text-xs text-stone-500">{formatDateTime(c.lastMessage.at)}</time>}
            </div>
            <p className="text-sm text-stone-600">
              {t(`chat.context.${c.context.type}`)}
              {c.context.title && ` · ${c.context.titleIsCategory ? tk('cat', c.context.title) : c.context.title}`}
            </p>
            {c.lastMessage && <p className="mt-1 truncate text-sm text-stone-800">{c.lastMessage.mine ? `${t('booking.you')}: ` : ''}{sysText(c.lastMessage)}</p>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function MessagesPage() {
  const { t } = useI18n();
  return (
    <RequireRole>
      <div className="container-page max-w-3xl py-8">
        <PageHeader title={t('chat.title')} />
        <Inbox />
      </div>
    </RequireRole>
  );
}
