'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { MapPin, MessageSquare, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { distanceLabel } from '@/components/WorkerCard';
import { useI18n } from '@/lib/i18n';
import { Alert, Badge, Button, EmptyState, LinkButton, LoadError, RequireRole, Spinner, useApiError, useLoad } from '@/components/ui';
import { Avatar, IndicativeRates, Rating, VerificationBadge } from '@/components/domain';
import ChatPanel from '@/components/ChatPanel';

interface Response {
  matchId: string;
  status: string;
  quote: { priceType: string; amount: number } | null;
  note: string | null;
  distanceKm: number | null;
  conversationId: string | null;
  worker: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    experienceYears: number;
    locality: string;
    verificationStatus: string;
    hourlyRate: number | null;
    visitCharge: number | null;
    baseRate: number | null;
    pricingBasis: string;
    completedJobsCount: number;
    rating: number | null;
    reviewCount: number;
    isDemoProfile: boolean;
  };
}

interface RequestView {
  id: string;
  requestNumber: string;
  category: string;
  problem: string;
  locality: string;
  city: string;
  address: { house: string; pincode: string | null; landmark: string | null } | null;
  start: string;
  end: string;
  status: 'open' | 'booked' | 'cancelled' | 'expired';
  bookingId: string | null;
  photoIds: string[];
  alertedCount: number;
  declinedCount: number;
  responses: Response[];
}

function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const { t, tk, formatDateTime, formatTime, formatMoney } = useI18n();
  const errorText = useApiError();
  const { data: r, error, loading, reload, setData } = useLoad(() => api.get<{ request: RequestView }>(`/api/requests/${id}`).then((x) => x.request), [id]);
  const [chatWith, setChatWith] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(() => {
    const a = params.get('alerted');
    if (a === null) return null;
    return Number(a) > 0 ? { tone: 'success', text: t('request.alerted', { n: a }) } : { tone: 'info', text: t('request.noneAlerted') };
  });

  // Check for new replies every 15 seconds while the request is open.
  useEffect(() => {
    if (r?.status !== 'open') return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') api.get<{ request: RequestView }>(`/api/requests/${id}`).then((x) => setData(x.request)).catch(() => undefined);
    }, 15_000);
    return () => clearInterval(timer);
  }, [id, r?.status, setData]);

  if (loading) return <Spinner />;
  if (error || !r)
    return (
      <div className="container-page py-10">
        <LoadError error={error} onRetry={reload} />
      </div>
    );

  const choose = async (matchId: string) => {
    setBusy(matchId);
    setMsg(null);
    try {
      const res = await api.post<{ bookingId: string }>(`/api/requests/${r.id}/select`, { matchId });
      router.push(`/bookings/${res.bookingId}`);
    } catch (e) {
      setMsg({ tone: 'error', text: errorText(e) });
      setBusy(null);
      reload();
    }
  };
  const rematch = async () => {
    setBusy('rematch');
    try {
      const res = await api.post<{ alerted: number }>(`/api/requests/${r.id}/rematch`);
      setMsg(res.alerted ? { tone: 'success', text: t('request.alerted', { n: res.alerted }) } : { tone: 'info', text: t('request.noneAlerted') });
      reload();
    } catch (e) {
      setMsg({ tone: 'error', text: errorText(e) });
    } finally {
      setBusy(null);
    }
  };
  const cancel = async () => {
    if (!window.confirm(t('request.cancelConfirm'))) return;
    setBusy('cancel');
    try {
      await api.del(`/api/requests/${r.id}`);
      reload();
    } catch (e) {
      setMsg({ tone: 'error', text: errorText(e) });
    } finally {
      setBusy(null);
    }
  };

  const chatResponse = r.responses.find((x) => x.matchId === chatWith);

  return (
    <div className="container-page py-8">
      <Link href="/customer/dashboard" className="link text-sm">
        ← {t('common.back')}
      </Link>
      <div className="mb-4 mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{tk('cat', r.category)}</h1>
          <p className="text-sm text-stone-600">
            {r.requestNumber} · {formatDateTime(r.start)} – {formatTime(r.end)}
          </p>
        </div>
        <Badge tone={r.status === 'open' ? 'orange' : r.status === 'booked' ? 'green' : 'neutral'}>{tk('request.status', r.status)}</Badge>
      </div>

      {msg && (
        <Alert tone={msg.tone} className="mb-4" onClose={() => setMsg(null)}>
          {msg.text}
        </Alert>
      )}
      {params.get('photoFailed') && <Alert tone="warning" className="mb-4">{t('request.photoUploadFailed')}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-5">
          <section className="card p-5">
            <p className="whitespace-pre-wrap break-words text-stone-900">{r.problem}</p>
            <p className="mt-3 flex items-center gap-1 text-sm text-stone-700">
              <MapPin className="h-4 w-4" aria-hidden />
              {[r.address?.house, r.locality, r.city].filter(Boolean).join(', ')}
            </p>
            {r.photoIds.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {r.photoIds.map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p} src={`/api/requests/${r.id}/photos/${p}`} alt="" className="h-24 w-24 rounded-lg border border-stone-200 object-cover" />
                ))}
              </div>
            )}
            <p className="mt-3 text-sm text-stone-600">{t('request.alertedCount', { n: r.alertedCount, d: r.declinedCount })}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {r.status === 'booked' && r.bookingId && <LinkButton href={`/bookings/${r.bookingId}`}>{t('request.goToBooking')}</LinkButton>}
              {r.status === 'open' && (
                <>
                  <Button variant="secondary" loading={busy === 'rematch'} onClick={rematch}>
                    {t('request.searchAgain')}
                  </Button>
                  <Button variant="danger" loading={busy === 'cancel'} onClick={cancel}>
                    {t('request.cancel')}
                  </Button>
                </>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-1 text-lg font-semibold text-stone-900">{t('request.responses')}</h2>
            {r.status === 'open' && <p className="mb-3 text-sm text-stone-600">{t('request.compareHint')}</p>}
            {r.responses.length === 0 ? (
              <EmptyState icon={Users} title={r.status === 'open' ? t('request.waiting') : tk('request.status', r.status)} />
            ) : (
              <ul className="space-y-3">
                {r.responses.map((x) => (
                  <li key={x.matchId} className={`card p-4 ${x.status === 'selected' ? 'border-2 border-green-600' : ''}`}>
                    <div className="flex items-start gap-3">
                      <Avatar src={x.worker.avatarUrl} name={x.worker.fullName} size={52} />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="font-semibold text-stone-900">
                          <Link href={`/workers/${x.worker.id}`} className="hover:underline">
                            {x.worker.fullName}
                          </Link>
                        </p>
                        <p className="text-sm text-stone-700">
                          {t('common.years', { n: x.worker.experienceYears })} · {x.worker.locality}
                          {x.distanceKm !== null && ` · ${distanceLabel(t, x.distanceKm)}`}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <VerificationBadge status={x.worker.verificationStatus} />
                          {x.worker.isDemoProfile && <Badge tone="amber">{t('common.demoProfile')}</Badge>}
                        </div>
                        <Rating rating={x.worker.rating} count={x.worker.reviewCount} />
                        <IndicativeRates w={x.worker} />
                      </div>
                    </div>
                    <div className="mt-3 rounded-lg bg-stone-50 p-3 text-sm">
                      <p className="font-semibold text-stone-900">
                        {t('request.quote')}: {x.quote ? `${formatMoney(x.quote.amount)} · ${tk('price', x.quote.priceType)}` : <span className="font-normal text-stone-700">{t('request.noQuote')}</span>}
                      </p>
                      {x.note && <p className="mt-1 text-stone-800">“{x.note}”</p>}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {x.conversationId && (
                        <Button variant="secondary" onClick={() => setChatWith(chatWith === x.matchId ? null : x.matchId)} aria-expanded={chatWith === x.matchId}>
                          <MessageSquare className="h-4 w-4" aria-hidden />
                          {t('request.chat')}
                        </Button>
                      )}
                      {r.status === 'open' && x.status === 'interested' && (
                        <Button loading={busy === x.matchId} disabled={!!busy} onClick={() => choose(x.matchId)}>
                          {busy === x.matchId ? t('request.choosing') : t('request.choose')}
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <div>{chatResponse?.conversationId && <ChatPanel key={chatResponse.conversationId} conversationId={chatResponse.conversationId} className="lg:sticky lg:top-20" />}</div>
      </div>
    </div>
  );
}

export default function RequestPage() {
  return (
    <RequireRole roles={['customer', 'admin']}>
      <Suspense>
        <RequestDetail />
      </Suspense>
    </RequireRole>
  );
}
