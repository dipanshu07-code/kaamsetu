'use client';

import React, { Suspense, useCallback, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Phone } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n, MessageKey } from '@/lib/i18n';
import { Alert, Button, ChoiceGroup, LoadError, Modal, RequireRole, SelectField, Spinner, TextArea, TextField, useApiError, useLoad } from '@/components/ui';
import { Avatar, BookingStatusBadge, SlotPicker, SlotValue, StarInput, defaultSlot, slotToIso, useBookingTitle } from '@/components/domain';
import ChatPanel from '@/components/ChatPanel';

interface Offer {
  id: string;
  proposedBy: 'customer' | 'worker';
  mine: boolean;
  priceType: string;
  amount: number;
  note: string | null;
  status: string;
  createdAt: string;
}

interface Booking {
  id: string;
  bookingNumber: string;
  viewerRole: 'customer' | 'worker' | 'admin';
  status: string;
  serviceTitle: string;
  category: string;
  serviceRequestId: string | null;
  startsAt: string;
  endsAt: string;
  jobDescription: string;
  priceType: string | null;
  indicativeAmount: number | null;
  agreedPrice: number | null;
  termsAgreedAt: string | null;
  holdExpiresAt: string | null;
  paymentMethod: string;
  address: { house: string | null; locality: string; city: string; pincode: string | null; landmark: string | null };
  worker: { id: string; name: string; avatarUrl: string | null; phone: string | null };
  customer: { name: string; phone: string | null };
  proofOfWorkNotes: string | null;
  cancellationReason: string | null;
  hasReview: boolean;
  history: { status: string; note: string | null; at: string }[];
  offers: Offer[];
  conversationId: string | null;
}

type Dialog = null | 'cancel' | 'decline' | 'reschedule' | 'complete' | 'dispute' | 'offer';

function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const isNew = useSearchParams().get('new') === '1';
  const { t, tk, formatDateTime, formatMoney } = useI18n();
  const errorText = useApiError();
  const bookingTitle = useBookingTitle();
  const { data: b, error, loading, reload, setData } = useLoad(() => api.get<{ booking: Booking }>(`/api/bookings/${id}`).then((r) => r.booking), [id]);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(isNew ? t('bookForm.sent') : null);
  const refreshQuiet = useCallback(() => {
    api.get<{ booking: Booking }>(`/api/bookings/${id}`).then((r) => setData(r.booking)).catch(() => undefined);
  }, [id, setData]);

  const act = async (path: string, body?: unknown, after?: () => void) => {
    setBusy(true);
    setActionError(null);
    try {
      const res = await api.post<{ booking?: Booking; ticket?: { ticketNumber: string } }>(path, body);
      if (res.booking) setData(res.booking);
      else await reload();
      if (res.ticket) setNotice(t('complaint.sent', { ticket: res.ticket.ticketNumber }));
      setDialog(null);
      after?.();
    } catch (e) {
      setActionError(errorText(e));
      if ((e as any)?.code === 'invalid_status') refreshQuiet();
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;
  if (error || !b)
    return (
      <div className="container-page py-10">
        <LoadError error={error} onRetry={reload} />
      </div>
    );

  const role = b.viewerRole;
  const other = role === 'customer' ? { name: b.worker.name, phone: b.worker.phone, label: t('booking.worker') } : { name: b.customer.name, phone: b.customer.phone, label: t('booking.customer') };
  const openOffer = b.offers.find((o) => o.status === 'open');
  const canNegotiate = ['pending', 'accepted'].includes(b.status) && role !== 'admin';
  const durationMin = Math.round((new Date(b.endsAt).getTime() - new Date(b.startsAt).getTime()) / 60000);

  return (
    <div className="container-page py-8">
      <div className="mb-4">
        <Link href={role === 'worker' ? '/worker/dashboard' : role === 'admin' ? '/admin' : '/customer/dashboard'} className="link text-sm">
          ← {t('common.back')}
        </Link>
      </div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{bookingTitle(b)}</h1>
          <p className="text-sm text-stone-600">{t('booking.title', { ref: b.bookingNumber })}</p>
        </div>
        <BookingStatusBadge status={b.status} />
      </div>

      {notice && (
        <Alert tone="success" className="mb-4" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}
      {actionError && (
        <Alert tone="error" className="mb-4" onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-5">
          <section className="card p-5">
            <p className="text-stone-800">{t(`statusHelp.${b.status}` as MessageKey)}</p>
            {b.status === 'accepted' && b.holdExpiresAt && <p className="mt-1 text-sm text-stone-600">{t('booking.holdUntil', { time: formatDateTime(b.holdExpiresAt) })}</p>}
            {b.cancellationReason && ['cancelled', 'declined'].includes(b.status) && <p className="mt-1 text-sm text-stone-600">“{b.cancellationReason === 'account_deleted' ? '—' : b.cancellationReason}”</p>}

            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-stone-700">{t('booking.when')}</dt>
                <dd className="text-stone-900">
                  {formatDateTime(b.startsAt)} · {durationMin < 60 ? t('common.minutes', { n: durationMin }) : t('common.hours', { n: Math.round((durationMin / 60) * 10) / 10 })}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-stone-700">{t('booking.where')}</dt>
                <dd className="text-stone-900">
                  {[b.address.house, b.address.locality, b.address.city, b.address.pincode].filter(Boolean).join(', ')}
                  {b.address.landmark && <span className="block text-stone-600">{b.address.landmark}</span>}
                  {!b.address.house && <span className="block text-stone-600">{t('alerts.addressHidden')}</span>}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-semibold text-stone-700">{t('booking.work')}</dt>
                <dd className="whitespace-pre-wrap break-words text-stone-900">{b.jobDescription}</dd>
              </div>
              <div>
                <dt className="font-semibold text-stone-700">{other.label}</dt>
                <dd className="flex items-center gap-2 text-stone-900">
                  {role === 'customer' && <Avatar src={b.worker.avatarUrl} name={b.worker.name} size={32} />}
                  {role === 'customer' ? (
                    <Link href={`/workers/${b.worker.id}`} className="link">
                      {b.worker.name}
                    </Link>
                  ) : (
                    other.name
                  )}
                </dd>
                {other.phone ? (
                  <a href={`tel:+91${other.phone}`} className="mt-1 inline-flex items-center gap-1 text-stone-900 underline">
                    <Phone className="h-4 w-4" aria-hidden />
                    {t('booking.callNumber', { phone: other.phone })}
                  </a>
                ) : (
                  <p className="mt-1 text-stone-600">{t('booking.contactHidden')}</p>
                )}
              </div>
              <div>
                <dt className="font-semibold text-stone-700">{b.agreedPrice !== null ? t('price.agreed') : t('price.indicative')}</dt>
                <dd className="text-stone-900">
                  {b.agreedPrice !== null ? (
                    <span className="text-lg font-bold">
                      {formatMoney(b.agreedPrice)} · {tk('price', b.priceType)}
                    </span>
                  ) : (
                    <>
                      {b.indicativeAmount ? `${formatMoney(b.indicativeAmount)} · ` : ''}
                      {tk('price', b.priceType)}
                      <span className="block text-stone-600">{t('price.notAgreed')}</span>
                    </>
                  )}
                  <span className="block text-stone-600">{b.paymentMethod === 'upi_direct' ? t('bookForm.upi') : t('bookForm.cash')}</span>
                </dd>
              </div>
            </dl>
            {b.proofOfWorkNotes && <p className="mt-4 rounded-lg bg-stone-50 p-3 text-sm text-stone-800">{b.proofOfWorkNotes}</p>}

            <div className="mt-5 flex flex-wrap gap-2">
              {role === 'worker' && b.status === 'pending' && (
                <>
                  <Button loading={busy} onClick={() => act(`/api/bookings/${b.id}/accept`)}>
                    {t('booking.accept')}
                  </Button>
                  <Button variant="secondary" onClick={() => setDialog('decline')}>
                    {t('booking.decline')}
                  </Button>
                </>
              )}
              {role === 'worker' && b.status === 'confirmed' && (
                <Button loading={busy} onClick={() => act(`/api/bookings/${b.id}/start`)}>
                  {t('booking.start')}
                </Button>
              )}
              {b.status === 'in_progress' && role !== 'admin' && <Button onClick={() => setDialog('complete')}>{t('booking.complete')}</Button>}
              {role === 'customer' && ['pending', 'accepted', 'confirmed'].includes(b.status) && (
                <Button variant="secondary" onClick={() => setDialog('reschedule')}>
                  {t('booking.reschedule')}
                </Button>
              )}
              {['pending', 'accepted', 'confirmed'].includes(b.status) && (
                <Button variant="danger" onClick={() => setDialog('cancel')}>
                  {t('booking.cancel')}
                </Button>
              )}
              {['confirmed', 'in_progress', 'completed'].includes(b.status) && role !== 'admin' && (
                <Button variant="ghost" onClick={() => setDialog('dispute')}>
                  {t('booking.dispute')}
                </Button>
              )}
              {role === 'customer' && ['cancelled', 'declined', 'expired'].includes(b.status) && (
                <Link href={`/workers?category=${b.category}`} className="link self-center text-sm">
                  {t('booking.findReplacement')}
                </Link>
              )}
            </div>
          </section>

          {(canNegotiate || b.offers.length > 0) && (
            <section className="card p-5">
              <h2 className="text-lg font-semibold text-stone-900">{t('booking.negotiation')}</h2>
              {b.termsAgreedAt && <p className="mt-1 text-sm text-stone-700">{t('booking.agreedOn', { date: formatDateTime(b.termsAgreedAt) })}</p>}
              {openOffer && (
                <div className="mt-3 rounded-lg border-2 border-brand-700 p-4">
                  <p className="text-sm text-stone-700">{t('booking.offerFrom', { who: openOffer.mine ? t('booking.you') : openOffer.proposedBy === 'customer' ? t('booking.theCustomer') : t('booking.theWorker') })}</p>
                  <p className="text-2xl font-bold text-stone-900">
                    {formatMoney(openOffer.amount)} <span className="text-base font-normal text-stone-700">{tk('price', openOffer.priceType)}</span>
                  </p>
                  {openOffer.note && <p className="mt-1 text-sm text-stone-800">“{openOffer.note}”</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {openOffer.mine ? (
                      <>
                        <p className="w-full text-sm text-stone-600">{t('booking.waitingForOther')}</p>
                        <Button variant="secondary" loading={busy} onClick={() => act(`/api/offers/${openOffer.id}`, { action: 'withdraw' })}>
                          {t('booking.withdrawOffer')}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button loading={busy} onClick={() => act(`/api/offers/${openOffer.id}`, { action: 'accept' })}>
                          {t('booking.acceptOffer', { amount: formatMoney(openOffer.amount) })}
                        </Button>
                        <Button variant="secondary" onClick={() => setDialog('offer')}>
                          {t('booking.counter')}
                        </Button>
                        <Button variant="ghost" loading={busy} onClick={() => act(`/api/offers/${openOffer.id}`, { action: 'reject' })}>
                          {t('booking.rejectOffer')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
              {canNegotiate && !openOffer && (
                <div className="mt-3">
                  <Button onClick={() => setDialog('offer')}>{t('booking.proposePrice')}</Button>
                  <p className="mt-2 text-sm text-stone-600">{t('chat.priceReminder')}</p>
                </div>
              )}
              {b.offers.filter((o) => o.status !== 'open').length > 0 && (
                <ul className="mt-4 space-y-1 text-sm text-stone-700">
                  {b.offers
                    .filter((o) => o.status !== 'open')
                    .map((o) => (
                      <li key={o.id}>
                        {formatMoney(o.amount)} {tk('price', o.priceType)} — {o.mine ? t('booking.you') : o.proposedBy === 'customer' ? t('booking.theCustomer') : t('booking.theWorker')} ·{' '}
                        {tk('offer.status', o.status)}
                      </li>
                    ))}
                </ul>
              )}
            </section>
          )}

          {role === 'customer' && b.status === 'completed' && !b.hasReview && <ReviewForm bookingId={b.id} onDone={(bk) => { setData(bk); setNotice(t('booking.reviewThanks')); }} />}

          <section className="card p-5">
            <h2 className="text-lg font-semibold text-stone-900">{t('booking.history')}</h2>
            <ol className="mt-3 space-y-2 text-sm">
              {b.history.map((h, i) => (
                <li key={i} className="flex flex-wrap gap-x-2">
                  <span className="font-semibold text-stone-900">{tk('status', h.status)}</span>
                  <time className="text-stone-600" dateTime={h.at}>
                    {formatDateTime(h.at)}
                  </time>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div>{b.conversationId && role !== 'admin' && <ChatPanel conversationId={b.conversationId} onEvent={refreshQuiet} className="lg:sticky lg:top-20" />}</div>
      </div>

      <ReasonDialog open={dialog === 'cancel'} title={t('booking.cancel')} help={t('booking.cancelHelp')} busy={busy} onClose={() => setDialog(null)} onSubmit={(reason) => act(`/api/bookings/${b.id}/cancel`, { reason })} />
      <ReasonDialog open={dialog === 'decline'} title={t('booking.decline')} busy={busy} onClose={() => setDialog(null)} onSubmit={(reason) => act(`/api/bookings/${b.id}/decline`, { reason })} />
      <CompleteDialog open={dialog === 'complete'} worker={role === 'worker'} busy={busy} onClose={() => setDialog(null)} onSubmit={(notes) => act(`/api/bookings/${b.id}/complete`, { notes: notes || undefined })} />
      <RescheduleDialog open={dialog === 'reschedule'} busy={busy} onClose={() => setDialog(null)} onSubmit={(s) => act(`/api/bookings/${b.id}/reschedule`, { start: slotToIso(s), durationMinutes: s.durationMinutes })} />
      <OfferDialog
        open={dialog === 'offer'}
        busy={busy}
        initialType={(openOffer?.priceType || b.priceType || 'visit') as 'visit'}
        initialAmount={openOffer?.amount || b.indicativeAmount || undefined}
        onClose={() => setDialog(null)}
        onSubmit={(o) => act(`/api/bookings/${b.id}/offers`, o)}
      />
      <DisputeDialog open={dialog === 'dispute'} busy={busy} onClose={() => setDialog(null)} onSubmit={(d) => act(`/api/bookings/${b.id}/dispute`, d)} />
    </div>
  );
}

function ReasonDialog({ open, title, help, busy, onClose, onSubmit }: { open: boolean; title: string; help?: string; busy: boolean; onClose: () => void; onSubmit: (r: string) => void }) {
  const { t } = useI18n();
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (reason.trim().length < 3) return setErr(t('validation.too_short'));
          onSubmit(reason.trim());
        }}
      >
        {help && <p className="text-sm text-stone-700">{help}</p>}
        <TextArea label={t('booking.reasonPrompt')} value={reason} error={err} maxLength={300} required onChange={(e) => setReason(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t('common.back')}
          </Button>
          <Button type="submit" variant="danger" loading={busy}>
            {t('common.confirm')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CompleteDialog({ open, worker, busy, onClose, onSubmit }: { open: boolean; worker: boolean; busy: boolean; onClose: () => void; onSubmit: (n: string) => void }) {
  const { t } = useI18n();
  const [notes, setNotes] = useState('');
  return (
    <Modal open={open} onClose={onClose} title={t('booking.complete')}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(notes.trim()); }}>
        {worker && <TextArea label={t('booking.completeNotes')} value={notes} maxLength={1000} onChange={(e) => setNotes(e.target.value)} />}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>{t('common.back')}</Button>
          <Button type="submit" loading={busy}>{t('common.confirm')}</Button>
        </div>
      </form>
    </Modal>
  );
}

function RescheduleDialog({ open, busy, onClose, onSubmit }: { open: boolean; busy: boolean; onClose: () => void; onSubmit: (s: SlotValue) => void }) {
  const { t } = useI18n();
  const [slot, setSlot] = useState<SlotValue>(defaultSlot());
  return (
    <Modal open={open} onClose={onClose} title={t('booking.reschedule')}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(slot); }}>
        <SlotPicker value={slot} onChange={setSlot} />
        <p className="text-sm text-stone-600">{t('sys.booking_rescheduled')}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>{t('common.back')}</Button>
          <Button type="submit" loading={busy}>{t('common.confirm')}</Button>
        </div>
      </form>
    </Modal>
  );
}

function OfferDialog({ open, busy, initialType, initialAmount, onClose, onSubmit }: { open: boolean; busy: boolean; initialType: 'visit' | 'hourly' | 'fixed'; initialAmount?: number; onClose: () => void; onSubmit: (o: { priceType: string; amount: number; note?: string }) => void }) {
  const { t } = useI18n();
  const [priceType, setPriceType] = useState<'visit' | 'hourly' | 'fixed'>(initialType);
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : '');
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  return (
    <Modal open={open} onClose={onClose} title={t('booking.proposePrice')}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(amount);
          if (!n || n <= 0) return setErr(t('validation.invalid'));
          onSubmit({ priceType, amount: n, note: note.trim() || undefined });
        }}
      >
        <ChoiceGroup<'visit' | 'hourly' | 'fixed'>
          legend={t('bookForm.priceType')}
          value={priceType}
          onChange={setPriceType}
          columns={3}
          options={[
            { value: 'visit', label: t('price.visit') },
            { value: 'hourly', label: t('price.hourly') },
            { value: 'fixed', label: t('price.fixed') },
          ]}
        />
        <TextField label={t('wp.rateAmount')} type="number" min={1} inputMode="numeric" value={amount} error={err} required onChange={(e) => setAmount(e.target.value)} />
        <TextField label={t('booking.offerNote')} value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" loading={busy}>{t('booking.sendOffer')}</Button>
        </div>
      </form>
    </Modal>
  );
}

function DisputeDialog({ open, busy, onClose, onSubmit }: { open: boolean; busy: boolean; onClose: () => void; onSubmit: (d: { category: string; description: string }) => void }) {
  const { t } = useI18n();
  const [category, setCategory] = useState('poor_work_quality');
  const [description, setDescription] = useState('');
  const [err, setErr] = useState<string | null>(null);
  return (
    <Modal open={open} onClose={onClose} title={t('complaint.title')}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (description.trim().length < 10) return setErr(t('validation.too_short'));
          onSubmit({ category, description: description.trim() });
        }}
      >
        <Alert tone="warning">{t('complaint.safetyNote')}</Alert>
        <SelectField label={t('complaint.category')} value={category} onChange={(e) => setCategory(e.target.value)}>
          {(['no_show', 'poor_work_quality', 'billing_dispute', 'unprofessional_behavior', 'safety_concern', 'other'] as const).map((c) => (
            <option key={c} value={c}>{t(`complaint.cat.${c}` as MessageKey)}</option>
          ))}
        </SelectField>
        <TextArea label={t('complaint.description')} value={description} error={err} maxLength={2000} required onChange={(e) => setDescription(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" loading={busy}>{t('complaint.submit')}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ReviewForm({ bookingId, onDone }: { bookingId: string; onDone: (b: Booking) => void }) {
  const { t } = useI18n();
  const errorText = useApiError();
  const [r, setR] = useState({ rating: 5, punctuality: 5, quality: 5, politeness: 5 });
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <section className="card p-5">
      <h2 className="text-lg font-semibold text-stone-900">{t('review.title')}</h2>
      <form
        className="mt-3 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(null);
          try {
            const res = await api.post<{ booking: Booking }>(`/api/bookings/${bookingId}/review`, { ...r, comment: comment.trim() || undefined });
            onDone(res.booking);
          } catch (e2) {
            setErr(errorText(e2));
            setBusy(false);
          }
        }}
      >
        {err && <Alert tone="error">{err}</Alert>}
        <StarInput label={t('review.overall')} value={r.rating} onChange={(n) => setR({ ...r, rating: n })} />
        <div className="grid gap-4 xl:grid-cols-2">
          <StarInput label={t('review.punctuality')} value={r.punctuality} onChange={(n) => setR({ ...r, punctuality: n })} />
          <StarInput label={t('review.quality')} value={r.quality} onChange={(n) => setR({ ...r, quality: n })} />
          <StarInput label={t('review.politeness')} value={r.politeness} onChange={(n) => setR({ ...r, politeness: n })} />
        </div>
        <TextArea label={t('review.comment')} value={comment} maxLength={1000} onChange={(e) => setComment(e.target.value)} />
        <Button type="submit" loading={busy}>{t('review.submit')}</Button>
      </form>
    </section>
  );
}

export default function BookingPage() {
  return (
    <RequireRole>
      <Suspense>
        <BookingDetail />
      </Suspense>
    </RequireRole>
  );
}
