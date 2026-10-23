'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { RequireRole, useLoad } from '@/components/ui';
import ChatPanel from '@/components/ChatPanel';

function contextHref(ctx: { type: string; id: string; ref?: string } | undefined, role?: string) {
  if (!ctx) return null;
  if (ctx.type === 'booking') return `/bookings/${ctx.id}`;
  if (ctx.type === 'request') return role === 'worker' ? '/worker/alerts' : `/requests/${ctx.id}`;
  if (ctx.type === 'application') return role === 'employer' ? `/employer/jobs/${ctx.ref}` : '/worker/applications';
  return null;
}

function Conversation() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const { user } = useSession();
  const { data } = useLoad(() => api.get<{ conversation: { context: { type: string; id: string; ref?: string } } }>(`/api/conversations/${id}`).then((r) => r.conversation), [id]);
  const href = contextHref(data?.context, user?.role);
  return (
    <div className="container-page max-w-3xl py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href="/messages" className="link text-sm">
          ← {t('chat.title')}
        </Link>
        {href && (
          <Link href={href} className="link text-sm">
            {t(`chat.context.${data!.context.type}` as any)}: {t('chat.viewContext')} →
          </Link>
        )}
      </div>
      <ChatPanel conversationId={id} />
    </div>
  );
}

export default function ConversationPage() {
  return (
    <RequireRole>
      <Conversation />
    </RequireRole>
  );
}
