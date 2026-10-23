import { z } from 'zod';
import { Db, Queryable } from '../db';
import { Actor } from '../auth';
import { ApiError, badRequest, conflict, forbidden, isExclusionViolation, isUniqueViolation, notFound } from '../errors';
import { PRICE_TYPES, PriceType } from '@/lib/domain';
import {
  addBookingHistory,
  ensureConversation,
  isBlockedEitherWay,
  iso,
  notify,
  num,
  referenceNumber,
  systemMessage,
  uuid,
} from './common';
import { assertEligible, getWorkerRow, isWorkerFree } from './workers';

const PRICE_BASIS: Record<PriceType, string> = { hourly: 'per-hour', visit: 'per-visit', fixed: 'quoted' };
const HOLD_HOURS = 24;

// ---------------------------------------------------------------------------
// Housekeeping: expire stale requests/holds so they release availability.
// ---------------------------------------------------------------------------
export async function expireStale(q: Queryable) {
  const { rows } = await q.query(
    `UPDATE bookings SET status = 'expired', updated_at = NOW()
      WHERE (status = 'pending' AND starts_at <= NOW())
         OR (status = 'accepted' AND (hold_expires_at <= NOW() OR starts_at <= NOW()))
      RETURNING id, customer_id, worker_id`,
  );
  for (const b of rows) {
    await addBookingHistory(q, b.id, 'expired', null, 'expired_automatically');
    await q.query(`UPDATE price_offers SET status = 'withdrawn' WHERE booking_id = $1 AND status = 'open'`, [b.id]);
    await notify(q, b.customer_id, 'booking_expired', {}, `/bookings/${b.id}`);
  }
  await q.query(`UPDATE service_requests SET status = 'expired', updated_at = NOW() WHERE status = 'open' AND preferred_end <= NOW()`);
}

// ---------------------------------------------------------------------------
// Loading & authorisation
// ---------------------------------------------------------------------------
const BOOKING_SELECT = `
  SELECT b.*, wp.user_id AS worker_user_id, wp.full_name AS worker_name, wp.avatar_url AS worker_avatar,
         wp.category_slug AS worker_category, wp.phone AS worker_phone, wp.category_slug, wp.safeguarding_hold,
         cu.full_name AS customer_name, cu.phone AS customer_phone
    FROM bookings b
    JOIN worker_profiles wp ON wp.id = b.worker_id
    JOIN users cu ON cu.id = b.customer_id`;

async function loadBooking(q: Queryable, id: string, lock = false) {
  if (!uuid.safeParse(id).success) throw notFound();
  if (lock) await q.query('SELECT id FROM bookings WHERE id = $1 FOR UPDATE', [id]);
  const { rows } = await q.query(`${BOOKING_SELECT} WHERE b.id = $1`, [id]);
  if (!rows[0]) throw notFound();
  return rows[0];
}

function partyRole(b: any, actor: Actor): 'customer' | 'worker' | 'admin' | null {
  if (b.customer_id === actor.id) return 'customer';
  if (actor.workerId && b.worker_id === actor.workerId) return 'worker';
  if (actor.role === 'admin') return 'admin';
  return null;
}

function requireParty(b: any, actor: Actor, allowAdmin = false) {
  const role = partyRole(b, actor);
  if (!role || (role === 'admin' && !allowAdmin)) throw notFound(); // don't reveal existence
  return role;
}

const ADDRESS_VISIBLE = ['accepted', 'confirmed', 'in_progress', 'completed', 'disputed'];
const CONTACT_VISIBLE = ['confirmed', 'in_progress'];

function bookingDto(b: any, viewer: 'customer' | 'worker' | 'admin') {
  const showAddress = viewer !== 'worker' || ADDRESS_VISIBLE.includes(b.status);
  const showContact = viewer === 'admin' || CONTACT_VISIBLE.includes(b.status);
  return {
    id: b.id,
    bookingNumber: b.booking_number,
    viewerRole: viewer,
    status: b.status,
    serviceTitle: b.service_title,
    category: b.service_category_slug,
    startsAt: iso(b.starts_at),
    endsAt: iso(b.ends_at),
    jobDescription: b.job_description,
    priceType: b.price_type,
    indicativeAmount: num(b.indicative_amount),
    agreedPrice: b.terms_agreed_at ? num(b.agreed_price) : null,
    termsAgreedAt: iso(b.terms_agreed_at),
    holdExpiresAt: iso(b.hold_expires_at),
    paymentMethod: b.payment_method,
    address: showAddress
      ? { house: b.address_house, locality: b.address_locality, city: b.address_city, pincode: b.address_pincode, landmark: b.address_landmark }
      : { house: null, locality: b.address_locality, city: b.address_city, pincode: null, landmark: null },
    worker: {
      id: b.worker_id,
      name: b.worker_name,
      avatarUrl: b.worker_avatar,
      category: b.worker_category,
      phone: viewer !== 'worker' && showContact ? b.worker_phone : null,
    },
    customer: {
      name: b.customer_name,
      phone: viewer !== 'customer' && showContact ? b.customer_phone : null,
    },
    proofOfWorkNotes: b.proof_of_work_notes,
    cancelledBy: b.cancelled_by,
    cancellationReason: b.cancellation_reason,
    hasReview: b.has_review,
    serviceRequestId: b.service_request_id,
    createdAt: iso(b.created_at),
    updatedAt: iso(b.updated_at),
  };
}

export type BookingDto = ReturnType<typeof bookingDto>;

// ---------------------------------------------------------------------------
// Create (customer books a specific worker directly)
// ---------------------------------------------------------------------------
export const addressSchema = z.object({
  house: z.string().trim().min(2).max(200),
  locality: z.string().trim().min(2).max(150),
  city: z.string().trim().min(2).max(100),
  pincode: z.string().trim().regex(/^\d{6}$/).optional().or(z.literal('')),
  landmark: z.string().trim().max(200).optional(),
});

export const createBookingSchema = z.object({
  workerId: uuid,
  serviceTitle: z.string().trim().min(2).max(150),
  start: z.string().datetime({ offset: true }),
  durationMinutes: z.number().int().min(30).max(720),
  address: addressSchema,
  description: z.string().trim().min(5).max(2000),
  priceType: z.enum(PRICE_TYPES).optional(),
  indicativeAmount: z.number().min(0).max(1_000_000).optional(),
  paymentMethod: z.enum(['cash_on_completion', 'upi_direct']).default('cash_on_completion'),
  idempotencyKey: z.string().min(8).max(80).optional(),
});

export function validateWindow(start: Date, end: Date) {
  const now = Date.now();
  if (start.getTime() < now + 30 * 60_000) throw badRequest('start_too_soon');
  if (start.getTime() > now + 90 * 86400_000) throw badRequest('start_too_far');
  if (end <= start) throw badRequest('invalid_range');
}

export async function createBooking(db: Db, actor: Actor, input: z.infer<typeof createBookingSchema>) {
  if (actor.role !== 'customer') throw forbidden('wrong_role');
  const start = new Date(input.start);
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  validateWindow(start, end);

  if (input.idempotencyKey) {
    const { rows } = await db.query('SELECT id FROM bookings WHERE customer_id = $1 AND idempotency_key = $2', [actor.id, input.idempotencyKey]);
    if (rows[0]) return getBooking(db, actor, rows[0].id);
  }

  try {
    const id = await db.transaction(async (tx) => {
      await expireStale(tx);
      const w = await getWorkerRow(tx, input.workerId);
      if (!w) throw notFound();
      const cat = await tx.query('SELECT is_enabled FROM service_categories WHERE slug = $1', [w.category_slug]);
      if (!cat.rows[0]?.is_enabled) throw conflict('category_disabled');
      if (!w.accepts_on_demand) throw conflict('worker_not_taking_bookings');
      await assertEligible(tx, w);
      if (await isBlockedEitherWay(tx, actor.id, w.user_id)) throw forbidden('blocked');
      if (!(await isWorkerFree(tx, w.id, start, end))) throw conflict('slot_unavailable');

      const { rows } = await tx.query(
        `INSERT INTO bookings(booking_number, customer_id, worker_id, service_category_slug, service_title, status,
            scheduled_date, scheduled_time_slot, starts_at, ends_at, address_house, address_locality, address_city,
            address_pincode, address_landmark, job_description, pricing_basis, price_type, indicative_amount,
            payment_method, idempotency_key)
         VALUES ($1, $2, $3, $4, $5, 'pending', ($6::timestamptz AT TIME ZONE 'Asia/Kolkata')::date, $7, $6, $8, $9, $10, $11,
                 $12, $13, $14, $15, $16, $17, $18, $19)
         RETURNING id`,
        [
          referenceNumber('KS'),
          actor.id,
          w.id,
          w.category_slug,
          input.serviceTitle,
          start,
          `${start.toISOString()}/${end.toISOString()}`,
          end,
          input.address.house,
          input.address.locality,
          input.address.city,
          input.address.pincode || null,
          input.address.landmark || null,
          input.description,
          input.priceType ? PRICE_BASIS[input.priceType] : w.pricing_basis,
          input.priceType || null,
          input.indicativeAmount ?? null,
          input.paymentMethod,
          input.idempotencyKey || null,
        ],
      );
      const bookingId: string = rows[0].id;
      await addBookingHistory(tx, bookingId, 'pending', actor.id, 'requested_by_customer');
      const conv = await ensureConversation(tx, { bookingId }, [actor.id, w.user_id]);
      await systemMessage(tx, conv, 'sys.booking_requested', { service: input.serviceTitle });
      await notify(tx, w.user_id, 'booking_requested', { service: input.serviceTitle, start: start.toISOString() }, `/bookings/${bookingId}`);
      return bookingId;
    });
    return getBooking(db, actor, id);
  } catch (e) {
    if (isUniqueViolation(e) && input.idempotencyKey) {
      const { rows } = await db.query('SELECT id FROM bookings WHERE customer_id = $1 AND idempotency_key = $2', [actor.id, input.idempotencyKey]);
      if (rows[0]) return getBooking(db, actor, rows[0].id);
    }
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------
export async function getBooking(db: Db | Queryable, actor: Actor, id: string) {
  const b = await loadBooking(db, id);
  const role = requireParty(b, actor, true);
  const [history, offers, conv] = await Promise.all([
    db.query('SELECT status, note, created_at FROM booking_status_history WHERE booking_id = $1 ORDER BY created_at', [id]),
    db.query('SELECT id, proposed_by, price_type, amount, note, status, created_at, responded_at FROM price_offers WHERE booking_id = $1 ORDER BY created_at', [id]),
    db.query('SELECT id FROM conversations WHERE booking_id = $1', [id]),
  ]);
  return {
    ...bookingDto(b, role),
    history: history.rows.map((h) => ({ status: h.status, note: h.note, at: iso(h.created_at) })),
    offers: offers.rows.map((o) => ({
      id: o.id,
      proposedBy: o.proposed_by === b.customer_id ? 'customer' : 'worker',
      mine: o.proposed_by === actor.id,
      priceType: o.price_type,
      amount: Number(o.amount),
      note: o.note,
      status: o.status,
      createdAt: iso(o.created_at),
      respondedAt: iso(o.responded_at),
    })),
    conversationId: conv.rows[0]?.id || null,
  };
}

export async function listMyBookings(db: Db, actor: Actor) {
  await expireStale(db);
  let rows: any[] = [];
  if (actor.role === 'customer') {
    rows = (await db.query(`${BOOKING_SELECT} WHERE b.customer_id = $1 ORDER BY b.starts_at DESC LIMIT 200`, [actor.id])).rows;
  } else if (actor.role === 'worker' && actor.workerId) {
    rows = (await db.query(`${BOOKING_SELECT} WHERE b.worker_id = $1 ORDER BY b.starts_at DESC LIMIT 200`, [actor.workerId])).rows;
  } else {
    throw forbidden('wrong_role');
  }
  return rows.map((r) => bookingDto(r, actor.role === 'customer' ? 'customer' : 'worker'));
}

// ---------------------------------------------------------------------------
// Status transitions
// ---------------------------------------------------------------------------
async function withSlotGuard<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (isExclusionViolation(e)) throw conflict('slot_unavailable');
    throw e;
  }
}

async function bookingConversation(tx: Queryable, b: any) {
  return ensureConversation(tx, { bookingId: b.id }, [b.customer_id, b.worker_user_id]);
}

/** Reserve the worker's time for a booking inside a transaction. */
async function reserveSlot(tx: Queryable, b: any) {
  await tx.query('SELECT id FROM worker_profiles WHERE id = $1 FOR UPDATE', [b.worker_id]);
  if (new Date(b.starts_at) <= new Date()) throw conflict('booking_in_past');
  await assertEligible(tx, { id: b.worker_id, category_slug: b.category_slug, safeguarding_hold: b.safeguarding_hold });
  if (!(await isWorkerFree(tx, b.worker_id, new Date(b.starts_at), new Date(b.ends_at), b.id))) {
    throw conflict('slot_unavailable');
  }
}

export async function acceptBooking(db: Db, actor: Actor, id: string) {
  await withSlotGuard(() =>
    db.transaction(async (tx) => {
      await expireStale(tx);
      const b = await loadBooking(tx, id, true);
      if (requireParty(b, actor) !== 'worker') throw forbidden('only_worker');
      if (b.status !== 'pending') throw conflict('invalid_status');
      await reserveSlot(tx, b);
      // Terms agreed before (e.g. a rescheduled booking) → confirmed straight away.
      const next = b.terms_agreed_at ? 'confirmed' : 'accepted';
      const hold = new Date(Math.min(Date.now() + HOLD_HOURS * 3600_000, new Date(b.starts_at).getTime()));
      await tx.query(`UPDATE bookings SET status = $2, hold_expires_at = $3, updated_at = NOW() WHERE id = $1`, [
        id,
        next,
        next === 'accepted' ? hold : null,
      ]);
      await addBookingHistory(tx, id, next, actor.id, 'accepted_by_worker');
      await systemMessage(tx, await bookingConversation(tx, b), next === 'confirmed' ? 'sys.booking_confirmed' : 'sys.booking_accepted');
      await notify(tx, b.customer_id, next === 'confirmed' ? 'booking_confirmed' : 'booking_accepted', { service: b.service_title }, `/bookings/${id}`);
    }),
  );
  return getBooking(db, actor, id);
}

const reasonSchema = z.string().trim().min(3).max(300);

export async function declineBooking(db: Db, actor: Actor, id: string, reason: string) {
  reasonSchema.parse(reason);
  await db.transaction(async (tx) => {
    const b = await loadBooking(tx, id, true);
    if (requireParty(b, actor) !== 'worker') throw forbidden('only_worker');
    if (b.status !== 'pending') throw conflict('invalid_status');
    await tx.query(`UPDATE bookings SET status = 'declined', cancellation_reason = $2, updated_at = NOW() WHERE id = $1`, [id, reason]);
    await tx.query(`UPDATE price_offers SET status = 'withdrawn' WHERE booking_id = $1 AND status = 'open'`, [id]);
    await addBookingHistory(tx, id, 'declined', actor.id, reason);
    await systemMessage(tx, await bookingConversation(tx, b), 'sys.booking_declined');
    await notify(tx, b.customer_id, 'booking_declined', { service: b.service_title }, `/bookings/${id}`);
  });
  return getBooking(db, actor, id);
}

export async function cancelBooking(db: Db, actor: Actor, id: string, reason: string) {
  reasonSchema.parse(reason);
  await db.transaction(async (tx) => {
    const b = await loadBooking(tx, id, true);
    const role = requireParty(b, actor, true);
    if (!['pending', 'accepted', 'confirmed'].includes(b.status)) throw conflict('invalid_status');
    await tx.query(
      `UPDATE bookings SET status = 'cancelled', cancelled_by = $2, cancellation_reason = $3, hold_expires_at = NULL, updated_at = NOW() WHERE id = $1`,
      [id, role, reason],
    );
    await tx.query(`UPDATE price_offers SET status = 'withdrawn' WHERE booking_id = $1 AND status = 'open'`, [id]);
    await addBookingHistory(tx, id, 'cancelled', actor.id, reason);
    // A cancelled request-based booking re-opens the request so the customer can pick another worker.
    if (b.service_request_id) {
      await tx.query(
        `UPDATE service_requests SET status = 'open', booking_id = NULL, updated_at = NOW()
          WHERE id = $1 AND preferred_end > NOW()`,
        [b.service_request_id],
      );
      await tx.query(
        `UPDATE service_request_workers SET status = 'declined' WHERE request_id = $1 AND worker_id = $2`,
        [b.service_request_id, b.worker_id],
      );
    }
    await systemMessage(tx, await bookingConversation(tx, b), 'sys.booking_cancelled', { by: role });
    const other = role === 'customer' ? [b.worker_user_id] : role === 'worker' ? [b.customer_id] : [b.customer_id, b.worker_user_id];
    for (const uid of other) await notify(tx, uid, 'booking_cancelled', { service: b.service_title, by: role }, `/bookings/${id}`);
  });
  return getBooking(db, actor, id);
}

export const rescheduleSchema = z.object({
  start: z.string().datetime({ offset: true }),
  durationMinutes: z.number().int().min(30).max(720),
});

/** Customer moves the booking. The worker must accept the new time again; the agreed price is kept. */
export async function rescheduleBooking(db: Db, actor: Actor, id: string, input: z.infer<typeof rescheduleSchema>) {
  const start = new Date(input.start);
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  validateWindow(start, end);
  await db.transaction(async (tx) => {
    const b = await loadBooking(tx, id, true);
    if (requireParty(b, actor) !== 'customer') throw forbidden('only_customer');
    if (!['pending', 'accepted', 'confirmed'].includes(b.status)) throw conflict('invalid_status');
    if (!(await isWorkerFree(tx, b.worker_id, start, end, b.id))) throw conflict('slot_unavailable');
    await tx.query(
      `UPDATE bookings SET status = 'pending', starts_at = $2, ends_at = $3,
          scheduled_date = ($2::timestamptz AT TIME ZONE 'Asia/Kolkata')::date, scheduled_time_slot = $4,
          hold_expires_at = NULL, updated_at = NOW() WHERE id = $1`,
      [id, start, end, `${start.toISOString()}/${end.toISOString()}`],
    );
    await addBookingHistory(tx, id, 'pending', actor.id, 'rescheduled');
    await systemMessage(tx, await bookingConversation(tx, b), 'sys.booking_rescheduled', { start: start.toISOString() });
    await notify(tx, b.worker_user_id, 'booking_rescheduled', { service: b.service_title, start: start.toISOString() }, `/bookings/${id}`);
  });
  return getBooking(db, actor, id);
}

export async function startBooking(db: Db, actor: Actor, id: string) {
  await db.transaction(async (tx) => {
    const b = await loadBooking(tx, id, true);
    if (requireParty(b, actor) !== 'worker') throw forbidden('only_worker');
    if (b.status !== 'confirmed') throw conflict('invalid_status');
    if (Date.now() < new Date(b.starts_at).getTime() - 2 * 3600_000) throw conflict('too_early_to_start');
    await tx.query(`UPDATE bookings SET status = 'in_progress', updated_at = NOW() WHERE id = $1`, [id]);
    await addBookingHistory(tx, id, 'in_progress', actor.id);
    await systemMessage(tx, await bookingConversation(tx, b), 'sys.booking_started');
    await notify(tx, b.customer_id, 'booking_started', { service: b.service_title }, `/bookings/${id}`);
  });
  return getBooking(db, actor, id);
}

export async function completeBooking(db: Db, actor: Actor, id: string, notes?: string) {
  const cleanNotes = notes ? z.string().trim().max(1000).parse(notes) : null;
  await db.transaction(async (tx) => {
    const b = await loadBooking(tx, id, true);
    const role = requireParty(b, actor);
    if (b.status !== 'in_progress') throw conflict('invalid_status');
    await tx.query(
      `UPDATE bookings SET status = 'completed', proof_of_work_notes = COALESCE($2, proof_of_work_notes), updated_at = NOW() WHERE id = $1`,
      [id, role === 'worker' ? cleanNotes : null],
    );
    await tx.query('UPDATE worker_profiles SET completed_jobs_count = completed_jobs_count + 1 WHERE id = $1', [b.worker_id]);
    await tx.query(
      `INSERT INTO work_history(worker_id, booking_id, project_title, description, locality, completion_date, verified_by_platform)
       VALUES ($1, $2, $3, $4, $5, (NOW() AT TIME ZONE 'Asia/Kolkata')::date, TRUE)`,
      [b.worker_id, id, b.service_title, cleanNotes, b.address_locality],
    );
    await addBookingHistory(tx, id, 'completed', actor.id);
    await systemMessage(tx, await bookingConversation(tx, b), 'sys.booking_completed');
    await notify(tx, role === 'worker' ? b.customer_id : b.worker_user_id, 'booking_completed', { service: b.service_title }, `/bookings/${id}`);
  });
  return getBooking(db, actor, id);
}

export const disputeSchema = z.object({
  category: z.enum(['unprofessional_behavior', 'billing_dispute', 'no_show', 'poor_work_quality', 'safety_concern', 'other']),
  description: z.string().trim().min(10).max(2000),
});

export async function disputeBooking(db: Db, actor: Actor, id: string, input: z.infer<typeof disputeSchema>) {
  return db.transaction(async (tx) => {
    const b = await loadBooking(tx, id, true);
    const role = requireParty(b, actor);
    if (!['confirmed', 'in_progress', 'completed'].includes(b.status)) throw conflict('invalid_status');
    await tx.query(`UPDATE bookings SET status = 'disputed', updated_at = NOW() WHERE id = $1`, [id]);
    await addBookingHistory(tx, id, 'disputed', actor.id, input.category);
    const { createComplaintTx } = await import('./support');
    const ticket = await createComplaintTx(tx, actor, {
      bookingId: id,
      category: input.category,
      subject: `Booking ${b.booking_number}`,
      description: input.description,
    });
    await notify(tx, role === 'customer' ? b.worker_user_id : b.customer_id, 'booking_disputed', { service: b.service_title }, `/bookings/${id}`);
    return ticket;
  });
}

// ---------------------------------------------------------------------------
// Price negotiation. A booking is confirmed ONLY when one party accepts the
// other party's offer — never by a chat message.
// ---------------------------------------------------------------------------
export const offerSchema = z.object({
  priceType: z.enum(PRICE_TYPES),
  amount: z.number().positive().max(1_000_000),
  note: z.string().trim().max(300).optional(),
});

export async function proposeOffer(db: Db, actor: Actor, bookingId: string, input: z.infer<typeof offerSchema>) {
  await db.transaction(async (tx) => {
    const b = await loadBooking(tx, bookingId, true);
    const role = requireParty(b, actor);
    if (!['pending', 'accepted'].includes(b.status)) throw conflict('invalid_status');
    if (await isBlockedEitherWay(tx, b.customer_id, b.worker_user_id)) throw forbidden('blocked');
    await tx.query(`UPDATE price_offers SET status = 'superseded', responded_at = NOW() WHERE booking_id = $1 AND status = 'open'`, [bookingId]);
    const { rows } = await tx.query(
      `INSERT INTO price_offers(booking_id, proposed_by, price_type, amount, note) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [bookingId, actor.id, input.priceType, input.amount, input.note || null],
    );
    await systemMessage(
      tx,
      await bookingConversation(tx, b),
      'sys.offer_proposed',
      { amount: input.amount, priceType: input.priceType, note: input.note || null, by: role },
      { kind: 'offer', senderId: actor.id, offerId: rows[0].id },
    );
    await notify(tx, role === 'customer' ? b.worker_user_id : b.customer_id, 'offer_received', { amount: input.amount, priceType: input.priceType }, `/bookings/${bookingId}`);
  });
  return getBooking(db, actor, bookingId);
}

export async function respondOffer(db: Db, actor: Actor, offerId: string, decision: 'accept' | 'reject') {
  if (!uuid.safeParse(offerId).success) throw notFound();
  const bookingId = await withSlotGuard(() =>
    db.transaction(async (tx) => {
      const { rows } = await tx.query('SELECT * FROM price_offers WHERE id = $1 FOR UPDATE', [offerId]);
      const o = rows[0];
      if (!o) throw notFound();
      const b = await loadBooking(tx, o.booking_id, true);
      const role = requireParty(b, actor);
      if (o.proposed_by === actor.id) throw forbidden('cannot_answer_own_offer');
      if (o.status !== 'open') throw conflict('offer_not_open');
      const conv = await bookingConversation(tx, b);
      const other = role === 'customer' ? b.worker_user_id : b.customer_id;

      if (decision === 'reject') {
        await tx.query(`UPDATE price_offers SET status = 'rejected', responded_at = NOW() WHERE id = $1`, [offerId]);
        await systemMessage(tx, conv, 'sys.offer_rejected', { amount: Number(o.amount) }, { senderId: actor.id });
        await notify(tx, other, 'offer_rejected', { amount: Number(o.amount) }, `/bookings/${b.id}`);
        return b.id;
      }

      if (!['pending', 'accepted'].includes(b.status)) throw conflict('invalid_status');
      // Agreeing on price while still 'pending' also commits the worker's time.
      if (b.status === 'pending') await reserveSlot(tx, b);
      await tx.query(`UPDATE price_offers SET status = 'accepted', responded_at = NOW() WHERE id = $1`, [offerId]);
      await tx.query(
        `UPDATE bookings SET status = 'confirmed', agreed_price = $2, price_type = $3, pricing_basis = $4,
            terms_agreed_at = NOW(), hold_expires_at = NULL, updated_at = NOW() WHERE id = $1`,
        [b.id, o.amount, o.price_type, PRICE_BASIS[o.price_type as PriceType]],
      );
      await addBookingHistory(tx, b.id, 'confirmed', actor.id, `price_agreed:${o.amount}:${o.price_type}`);
      await systemMessage(tx, conv, 'sys.offer_accepted', { amount: Number(o.amount), priceType: o.price_type }, { senderId: actor.id });
      await notify(tx, other, 'booking_confirmed', { service: b.service_title, amount: Number(o.amount) }, `/bookings/${b.id}`);
      return b.id;
    }),
  );
  return getBooking(db, actor, bookingId);
}

export async function withdrawOffer(db: Db, actor: Actor, offerId: string) {
  if (!uuid.safeParse(offerId).success) throw notFound();
  const bookingId = await db.transaction(async (tx) => {
    const { rows } = await tx.query('SELECT * FROM price_offers WHERE id = $1 FOR UPDATE', [offerId]);
    const o = rows[0];
    if (!o || o.proposed_by !== actor.id) throw notFound();
    if (o.status !== 'open') throw conflict('offer_not_open');
    await tx.query(`UPDATE price_offers SET status = 'withdrawn', responded_at = NOW() WHERE id = $1`, [offerId]);
    const b = await loadBooking(tx, o.booking_id);
    await systemMessage(tx, await bookingConversation(tx, b), 'sys.offer_withdrawn', { amount: Number(o.amount) }, { senderId: actor.id });
    return o.booking_id as string;
  });
  return getBooking(db, actor, bookingId);
}

// ---------------------------------------------------------------------------
// Reviews (only for the customer's own completed booking, once)
// ---------------------------------------------------------------------------
export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  punctuality: z.number().int().min(1).max(5),
  quality: z.number().int().min(1).max(5),
  politeness: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export async function reviewBooking(db: Db, actor: Actor, id: string, input: z.infer<typeof reviewSchema>) {
  try {
    await db.transaction(async (tx) => {
      const b = await loadBooking(tx, id, true);
      if (requireParty(b, actor) !== 'customer') throw forbidden('only_customer');
      if (b.status !== 'completed') throw conflict('review_not_allowed');
      if (b.has_review) throw conflict('already_reviewed');
      await tx.query(
        `INSERT INTO reviews(booking_id, worker_id, customer_id, rating, punctuality_rating, work_quality_rating, politeness_rating, comment, is_verified_job)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)`,
        [id, b.worker_id, actor.id, input.rating, input.punctuality, input.quality, input.politeness, input.comment || null],
      );
      await tx.query('UPDATE bookings SET has_review = TRUE WHERE id = $1', [id]);
      await tx.query(
        `UPDATE worker_profiles wp SET rating = s.avg, review_count = s.cnt
           FROM (SELECT AVG(rating)::numeric(3,2) AS avg, COUNT(*)::int AS cnt FROM reviews WHERE worker_id = $1) s
          WHERE wp.id = $1`,
        [b.worker_id],
      );
      await tx.query('UPDATE work_history SET customer_rating = $2 WHERE booking_id = $1', [id, input.rating]);
      await notify(tx, b.worker_user_id, 'review_received', { rating: input.rating }, `/workers/${b.worker_id}`);
    });
  } catch (e) {
    if (isUniqueViolation(e)) throw conflict('already_reviewed');
    throw e;
  }
}

export { ApiError };
