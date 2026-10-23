'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Ban, Flag, Lock, RotateCcw } from 'lucide-react';
import { api, ApiClientError } from '@/lib/api';
import { useI18n, MessageKey } from '@/lib/i18n';
import { Alert, Button, Checkbox, Modal, SelectField, TextArea, useApiError } from './ui';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  mine: boolean;
  senderName: string | null;
  kind: 'text' | 'system' | 'offer';
  body: string;
  params: Record<string, any> | null;
  createdAt: string;
  // client-only
  pending?: boolean;
  failed?: boolean;
  clientId?: string;
}

interface Conversation {
  id: string;
  otherName: string | null;
  context: { type: 'booking' | 'request' | 'application'; id: string; title: string | null; status: string | null };
  iBlocked: boolean;
  blockedMe: boolean;
  messages: Message[];
}

const POLL_MS = 4000;

/** Renders system events in the reader's language; user text is shown as written. */
export function useSystemText() {
  const { t, tk, formatMoney } = useI18n();
  return useCallback(
    (m: Pick<Message, 'kind' | 'body' | 'params'>) => {
      if (m.kind === 'text') return m.body;
      const p = { ...(m.params || {}) };
      if (typeof p.amount === 'number') p.amount = formatMoney(p.amount);
      if (p.priceType) p.priceType = tk('price', p.priceType);
      if (p.status) p.status = tk('appStatus', p.status);
      let key = m.body as MessageKey;
      if (key === 'sys.worker_interested' && p.amount) key = 'sys.worker_interested_quote';
      const text = t(key, p);
      return text === key ? m.body : p.note && key.startsWith('sys.offer') ? `${text} — “${p.note}”` : text;
    },
    [t, tk, formatMoney],
  );
}

export default function ChatPanel({ conversationId, onEvent, className }: { conversationId: string; onEvent?: () => void; className?: string }) {
  const { t, formatDateTime } = useI18n();
  const errorText = useApiError();
  const sysText = useSystemText();
  const [conv, setConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const lastAt = useRef<string | null>(null);
  const seenSystem = useRef(0);

  const scrollToEnd = () => requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }));

  const load = useCallback(
    async (initial = false) => {
      try {
        const q = !initial && lastAt.current ? `?after=${encodeURIComponent(lastAt.current)}` : '';
        const { conversation } = await api.get<{ conversation: Conversation }>(`/api/conversations/${conversationId}${q}`);
        setConv(conversation);
        if (conversation.messages.length) {
          lastAt.current = conversation.messages[conversation.messages.length - 1].createdAt;
          setMessages((prev) => {
            const known = new Set(prev.map((m) => m.id));
            const fresh = conversation.messages.filter((m) => !known.has(m.id));
            return initial ? conversation.messages : [...prev, ...fresh];
          });
          const sys = conversation.messages.filter((m) => m.kind !== 'text').length;
          if (!initial && sys > 0 && sys !== seenSystem.current) onEvent?.();
          seenSystem.current = sys;
          scrollToEnd();
        }
        setLoadError(null);
      } catch (e) {
        if (initial) setLoadError(e);
      }
    },
    [conversationId, onEvent],
  );

  useEffect(() => {
    lastAt.current = null;
    load(true);
    const id = setInterval(() => document.visibilityState === 'visible' && load(false), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const send = async (body: string, clientId = `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`) => {
    const temp: Message = { id: clientId, clientId, mine: true, senderName: null, kind: 'text', body, params: null, createdAt: new Date().toISOString(), pending: true };
    setMessages((prev) => [...prev.filter((m) => m.clientId !== clientId), temp]);
    scrollToEnd();
    setSendError(null);
    try {
      const { message } = await api.post<{ message: Message }>(`/api/conversations/${conversationId}`, { body, clientId });
      setMessages((prev) =>
        prev.some((m) => m.id === message.id) ? prev.filter((m) => m.clientId !== clientId) : prev.map((m) => (m.clientId === clientId ? message : m)),
      );
      lastAt.current = message.createdAt;
    } catch (e) {
      setMessages((prev) => prev.map((m) => (m.clientId === clientId ? { ...m, failed: true } : m)));
      setSendError(errorText(e));
      if (e instanceof ApiClientError && e.code === 'blocked') load(false);
    }
  };

  const toggleBlock = async () => {
    if (!conv) return;
    try {
      await api.post(`/api/conversations/${conversationId}/block`, { block: !conv.iBlocked });
      setConv({ ...conv, iBlocked: !conv.iBlocked });
    } catch (e) {
      setSendError(errorText(e));
    }
  };

  if (loadError) return <Alert tone="error">{errorText(loadError)}</Alert>;
  const blocked = conv?.iBlocked || conv?.blockedMe;

  return (
    <section className={cn('card flex flex-col', className)} aria-label={conv?.otherName ? t('chat.with', { name: conv.otherName }) : t('chat.title')}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 px-4 py-3">
        <h2 className="font-semibold text-stone-900">{conv?.otherName ? t('chat.with', { name: conv.otherName }) : t('chat.title')}</h2>
        {conv && (
          <div className="flex gap-1">
            <Button variant="ghost" className="min-h-[36px] px-2 text-xs" onClick={() => setReportOpen(true)}>
              <Flag className="h-4 w-4" aria-hidden />
              {t('chat.report')}
            </Button>
            <Button variant="ghost" className="min-h-[36px] px-2 text-xs" onClick={toggleBlock}>
              <Ban className="h-4 w-4" aria-hidden />
              {conv.iBlocked ? t('chat.unblock') : t('chat.block')}
            </Button>
          </div>
        )}
      </div>

      <div ref={listRef} className="max-h-[420px] min-h-[200px] flex-1 space-y-2 overflow-y-auto px-4 py-3" aria-live="polite" aria-relevant="additions">
        {!conv && <p className="text-sm text-stone-600">{t('common.loading')}</p>}
        {conv && messages.length === 0 && <p className="text-sm text-stone-600">{t('chat.noMessages')}</p>}
        {messages.map((m) =>
          m.kind === 'text' ? (
            <div key={m.id} className={cn('flex', m.mine ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[85%] rounded-lg px-3 py-2 text-sm', m.mine ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-900')}>
                {!m.mine && m.senderName && <p className="text-xs font-semibold text-stone-600">{m.senderName}</p>}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={cn('mt-1 text-[11px]', m.mine ? 'text-stone-300' : 'text-stone-500')}>
                  {m.failed ? (
                    <button type="button" className="inline-flex items-center gap-1 font-semibold text-red-200 underline" onClick={() => send(m.body, m.clientId)}>
                      <RotateCcw className="h-3 w-3" aria-hidden />
                      {t('chat.failed')}
                    </button>
                  ) : m.pending ? (
                    t('chat.sending')
                  ) : (
                    <time dateTime={m.createdAt}>{formatDateTime(m.createdAt)}</time>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div key={m.id} className="text-center">
              <p className={cn('inline-block rounded-md px-3 py-1.5 text-xs', m.kind === 'offer' ? 'border border-brand-200 bg-brand-50 text-brand-900' : 'bg-stone-100 text-stone-700')}>
                {sysText(m)} · <time dateTime={m.createdAt}>{formatDateTime(m.createdAt)}</time>
              </p>
            </div>
          ),
        )}
      </div>

      <div className="space-y-2 border-t border-stone-200 p-3">
        {conv?.context.type !== 'application' && <p className="text-xs text-stone-600">{t('chat.priceReminder')}</p>}
        {sendError && <Alert tone="error" onClose={() => setSendError(null)}>{sendError}</Alert>}
        {blocked ? (
          <p className="flex items-center gap-2 text-sm text-stone-700">
            <Lock className="h-4 w-4" aria-hidden />
            {conv?.iBlocked ? t('chat.blockedByYou') : t('chat.blockedYou')}
          </p>
        ) : (
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const body = draft.trim();
              if (!body) return;
              setDraft('');
              send(body);
            }}
          >
            <label className="sr-only" htmlFor={`msg-${conversationId}`}>
              {t('chat.placeholder')}
            </label>
            <textarea
              id={`msg-${conversationId}`}
              rows={2}
              maxLength={2000}
              className="input flex-1 resize-none"
              placeholder={t('chat.placeholder')}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  (e.currentTarget.form as HTMLFormElement).requestSubmit();
                }
              }}
            />
            <Button type="submit" disabled={!draft.trim()}>
              {t('chat.send')}
            </Button>
          </form>
        )}
        <p className="text-[11px] text-stone-500">{t('chat.adminNotice')}</p>
      </div>

      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} conversationId={conversationId} onReported={() => load(false)} />
    </section>
  );
}

function ReportDialog({ open, onClose, conversationId, onReported }: { open: boolean; onClose: () => void; conversationId: string; onReported: () => void }) {
  const { t } = useI18n();
  const errorText = useApiError();
  const [reason, setReason] = useState('harassment');
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [state, setState] = useState<{ busy?: boolean; error?: string; done?: boolean }>({});
  return (
    <Modal open={open} onClose={onClose} title={t('chat.reportTitle')}>
      {state.done ? (
        <div className="space-y-4">
          <Alert tone="success">{t('chat.reportSent')}</Alert>
          <Button onClick={onClose}>{t('common.close')}</Button>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setState({ busy: true });
            try {
              await api.post(`/api/conversations/${conversationId}/report`, { reason, details: details || undefined, alsoBlock });
              setState({ done: true });
              onReported();
            } catch (err) {
              setState({ error: errorText(err) });
            }
          }}
        >
          {state.error && <Alert tone="error">{state.error}</Alert>}
          <SelectField label={t('chat.reportReason')} value={reason} onChange={(e) => setReason(e.target.value)}>
            {(['harassment', 'threat', 'fraud', 'inappropriate', 'spam', 'other'] as const).map((r) => (
              <option key={r} value={r}>
                {t(`chat.reason.${r}` as MessageKey)}
              </option>
            ))}
          </SelectField>
          <TextArea label={t('chat.reportDetails')} value={details} maxLength={1000} onChange={(e) => setDetails(e.target.value)} />
          <Checkbox label={t('chat.alsoBlock')} checked={alsoBlock} onChange={(e) => setAlsoBlock(e.target.checked)} />
          <p className="text-sm text-stone-600">{t('complaint.safetyNote')}</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={state.busy}>
              {t('common.send')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
