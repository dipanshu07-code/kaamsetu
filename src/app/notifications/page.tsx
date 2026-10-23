'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n, MessageKey } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { Button, EmptyState, LoadError, PageHeader, RequireRole, Spinner, useLoad } from '@/components/ui';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  params: Record<string, any>;
  link: string | null;
  read: boolean;
  createdAt: string;
}

/** Notification text is built from type + params in the reader's language. */
function useNotificationText() {
  const { t, tk, formatMoney, formatDateTime } = useI18n();
  return (n: Notification) => {
    const p = { ...n.params };
    if (typeof p.amount === 'number') p.amount = formatMoney(p.amount);
    if (p.category) p.category = tk('cat', p.category);
    if (p.status) p.status = tk(n.type === 'application_status' ? 'appStatus' : 'complaint.status', p.status);
    if (p.type) p.type = tk('check', p.type);
    if (p.outcome) p.outcome = tk('checkStatus', p.outcome);
    let text = t(`notif.${n.type}` as MessageKey, p);
    if (p.start) text += ` · ${formatDateTime(p.start)}`;
    return text;
  };
}

function List() {
  const { t, formatDateTime } = useI18n();
  const { refresh } = useSession();
  const text = useNotificationText();
  const { data, error, loading, reload, setData } = useLoad(() => api.get<{ notifications: Notification[] }>('/api/notifications').then((r) => r.notifications), []);
  if (loading) return <Spinner />;
  if (error) return <LoadError error={error} onRetry={reload} />;
  if (!data?.length) return <EmptyState icon={Bell} title={t('notif.empty')} />;
  const markRead = async (ids?: string[]) => {
    await api.post('/api/notifications', { ids }).catch(() => undefined);
    setData(data.map((n) => (!ids || ids.includes(n.id) ? { ...n, read: true } : n)));
    refresh();
  };
  return (
    <>
      {data.some((n) => !n.read) && (
        <div className="mb-3 flex justify-end">
          <Button variant="secondary" onClick={() => markRead()}>
            {t('notif.markAll')}
          </Button>
        </div>
      )}
      <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
        {data.map((n) => {
          const body = (
            <>
              <p className={cn('text-stone-900', !n.read && 'font-semibold')}>
                {!n.read && <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-brand-700 align-middle" aria-hidden />}
                {text(n)}
              </p>
              <time className="text-xs text-stone-500" dateTime={n.createdAt}>
                {formatDateTime(n.createdAt)}
              </time>
            </>
          );
          return (
            <li key={n.id}>
              {n.link ? (
                <Link href={n.link} onClick={() => !n.read && markRead([n.id])} className="block p-4 hover:bg-stone-50">
                  {body}
                </Link>
              ) : (
                <div className="p-4">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function NotificationsPage() {
  const { t } = useI18n();
  return (
    <RequireRole>
      <div className="container-page max-w-3xl py-8">
        <PageHeader title={t('notif.title')} />
        <List />
      </div>
    </RequireRole>
  );
}
