import { z } from 'zod';
import { Db, Queryable } from '../db';
import { Actor } from '../auth';
import { badRequest, conflict, forbidden, isExclusionViolation, notFound } from '../errors';
import { evaluateEligibility, PRICE_TYPES, PriceType } from '@/lib/domain';
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
import { assertEligible, isWorkerFree, loadChecks, slotStates } from './workers';
import { addressSchema, expireStale, validateWindow } from './bookings';

const MAX_ALERTS = 25;
const PRICE_BASIS: Record<PriceType, string> = { hourly: 'per-hour', visit: 'per-visit', fixed: 'quoted' };

export const createRequestSchema = z.object({
  categorySlug: z.string().max(50),
  problem: z.string().trim().min(5).max(2000),
  localityId: uuid.optional().nullable(),
  address: addressSchema,
  start: z.string().datetime({ offset: true }),
  durationMinutes: z.number().int().min(30).max(720),
  priceType: z.enum(PRICE_TYPES).optional(),
});

/**
 * Finds workers who can take this request: same category, taking on-demand
 * work, eligible under the category's verification policy, not suspended,
 * free at the requested time, and nearby (distance when both locations have
 * coordinates, otherwise preferred-locality / same-locality / same-city match).
 */
export async function findEligibleWorkers(q: Queryable, req: any, excludeWorkerIds: string[] = []) {
  const { rows } = await q.query(
    `SELECT wp.id, wp.user_id, wp.category_slug, wp.safeguarding_hold, wp.service_radius_km, wp.locality_id,
            wp.preferred_locality_ids, wp.locality, km_between(l.lat, l.lng, rl.lat, rl.lng) AS distance_km
       FROM worker_profiles wp
       JOIN users u ON u.id = wp.user_id AND u.deleted_at IS NULL AND NOT u.is_suspended AND u.is_active
       LEFT JOIN localities l ON l.id = wp.locality_id
       LEFT JOIN localities rl ON rl.id = $2
      WHERE wp.category_slug = $1 AND wp.accepts_on_demand AND wp.city = $3
        AND wp.user_id <> $4 AND NOT (wp.id = ANY($5::uuid[]))`,
    [req.category_slug, req.locality_id, req.city, req.customer_id, excludeWorkerIds],
  );
  const ids = rows.map((r) => r.id);
  const checks = await loadChecks(q, ids);
  const slots = await slotStates(q, ids, new Date(req.preferred_start), new Date(req.preferred_end));

  const candidates = [];
  for (const r of rows) {
    if (!evaluateEligibility(r.category_slug, checks.get(r.id) || [], r.safeguarding_hold).eligible) continue;
    if (slots.get(r.id) === 'unavailable') continue;
    const prefers = req.locality_id && (r.locality_id === req.locality_id || (r.preferred_locality_ids || []).includes(req.locality_id));
    const sameLocalityText = !req.locality_id && r.locality?.toLowerCase() === String(req.locality_text).toLowerCase();
    const withinTravel = r.distance_km != null && r.distance_km <= r.service_radius_km;
    // Without coordinates we can't measure distance, so we only match on locality.
    const nearby = prefers || sameLocalityText || withinTravel || (r.distance_km == null && !req.locality_id);
    if (!nearby) continue;
    if (await isBlockedEitherWay(q, req.customer_id, r.user_id)) continue;
    candidates.push({ ...r, distance_km: r.distance_km, prefers: !!prefers });
  }
  candidates.sort((a, b) => Number(b.prefers) - Number(a.prefers) || (a.distance_km ?? 1e9) - (b.distance_km ?? 1e9));
  return candidates.slice(0, MAX_ALERTS);
}

async function alertWorkers(tx: Queryable, req: any, workers: any[]) {
  for (const w of workers) {
    await tx.query(
      `INSERT INTO service_request_workers(request_id, worker_id, distance_km) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [req.id, w.id, w.distance_km],
    );
    await notify(tx, w.user_id, 'job_alert', { category: req.category_slug, locality: req.locality_text, start: iso(req.preferred_start) }, `/worker/alerts`);
  }
}

export async function createRequest(db: Db, actor: Actor, input: z.infer<typeof createRequestSchema>) {
  if (actor.role !== 'customer') throw forbidden('wrong_role');
  const start = new Date(input.start);
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  validateWindow(start, end);
  return db.transaction(async (tx) => {
    const cat = await tx.query('SELECT is_enabled FROM service_categories WHERE slug = $1', [input.categorySlug]);
    if (!cat.rows[0]) throw badRequest('validation_failed', { categorySlug: 'invalid' });
    if (!cat.rows[0].is_enabled) throw conflict('category_disabled');
    let locality = { id: null as string | null, name: input.address.locality, city: input.address.city };
    if (input.localityId) {
      const { rows } = await tx.query('SELECT id, name, city FROM localities WHERE id = $1', [input.localityId]);
      if (!rows[0]) throw badRequest('validation_failed', { localityId: 'invalid' });
      locality = rows[0];
    }
    const { rows } = await tx.query(
      `INSERT INTO service_requests(request_number, customer_id, category_slug, problem, locality_id, locality_text, city,
          address_house, address_pincode, address_landmark, preferred_start, preferred_end, preferred_price_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        referenceNumber('SR'),
        actor.id,
        input.categorySlug,
        input.problem,
        locality.id,
        locality.name,
        locality.city,
        input.address.house,
        input.address.pincode || null,
        input.address.landmark || null,
        start,
        end,
        input.priceType || null,
      ],
    );
    const req = rows[0];
    const workers = await findEligibleWorkers(tx, req);
    await alertWorkers(tx, req, workers);
    return { id: req.id as string, alerted: workers.length };
  });
}

/** Re-run matching for an open request (e.g. nobody was available at first). */
export async function rematchRequest(db: Db, actor: Actor, id: string) {
  return db.transaction(async (tx) => {
    const req = await loadOwnRequest(tx, actor, id, true);
    if (req.status !== 'open') throw conflict('invalid_status');
    const existing = await tx.query('SELECT worker_id FROM service_request_workers WHERE request_id = $1', [id]);
    const workers = await findEligibleWorkers(tx, req, existing.rows.map((r) => r.worker_id));
    await alertWorkers(tx, req, workers);
    return { alerted: workers.length };
  });
}

async function loadOwnRequest(q: Queryable, actor: Actor, id: string, lock = false) {
  if (!uuid.safeParse(id).success) throw notFound();
  const { rows } = await q.query(`SELECT * FROM service_requests WHERE id = $1 ${lock ? 'FOR UPDATE' : ''}`, [id]);
  const r = rows[0];
  if (!r || (r.customer_id !== actor.id && actor.role !== 'admin')) throw notFound();
  return r;
}

function requestDto(r: any, includeAddress: boolean) {
  return {
    id: r.id,
    requestNumber: r.request_number,
    category: r.category_slug,
    problem: r.problem,
    locality: r.locality_text,
    city: r.city,
    address: includeAddress ? { house: r.address_house, pincode: r.address_pincode, landmark: r.address_landmark } : null,
    start: iso(r.preferred_start),
    end: iso(r.preferred_end),
    priceType: r.preferred_price_type,
    status: r.status,
    bookingId: r.booking_id,
    createdAt: iso(r.created_at),
  };
}

export async function listMyRequests(db: Db, actor: Actor) {
  if (actor.role !== 'customer') throw forbidden('wrong_role');
  await expireStale(db);
  const { rows } = await db.query(
    `SELECT sr.*,
        (SELECT COUNT(*)::int FROM service_request_workers m WHERE m.request_id = sr.id) AS alerted,
        (SELECT COUNT(*)::int FROM service_request_workers m WHERE m.request_id = sr.id AND m.status = 'interested') AS interested
       FROM service_requests sr WHERE sr.customer_id = $1 ORDER BY sr.created_at DESC LIMIT 100`,
    [actor.id],
  );
  return rows.map((r) => ({ ...requestDto(r, true), alerted: r.alerted, interested: r.interested }));
}

/** Customer view: request + interested workers to compare (public profile fields only). */
export async function getRequestForCustomer(db: Db, actor: Actor, id: string) {
  await expireStale(db);
  const req = await loadOwnRequest(db, actor, id);
  const { rows } = await db.query(
    `SELECT m.id AS match_id, m.status, m.quote_price_type, m.quote_amount, m.note, m.distance_km, m.responded_at,
            wp.id AS worker_id, wp.full_name, wp.avatar_url, wp.experience_years, wp.locality, wp.verification_status,
            wp.hourly_rate, wp.visit_charge, wp.base_rate, wp.pricing_basis, wp.completed_jobs_count, wp.is_demo_profile,
            rv.avg_rating, rv.review_count, c.id AS conversation_id
       FROM service_request_workers m
       JOIN worker_profiles wp ON wp.id = m.worker_id
       LEFT JOIN LATERAL (SELECT AVG(r.rating)::float AS avg_rating, COUNT(*)::int AS review_count FROM reviews r WHERE r.worker_id = wp.id) rv ON TRUE
       LEFT JOIN conversations c ON c.request_match_id = m.id
      WHERE m.request_id = $1
      ORDER BY (m.status = 'interested') DESC, m.distance_km NULLS LAST`,
    [id],
  );
  const photos = await db.query('SELECT id FROM service_request_photos WHERE request_id = $1 ORDER BY created_at', [id]);
  return {
    ...requestDto(req, true),
    photoIds: photos.rows.map((p) => p.id),
    alertedCount: rows.length,
    declinedCount: rows.filter((r) => r.status === 'declined').length,
    responses: rows
      .filter((r) => ['interested', 'selected', 'not_selected'].includes(r.status))
      .map((r) => ({
        matchId: r.match_id,
        status: r.status,
        quote: r.quote_amount ? { priceType: r.quote_price_type, amount: Number(r.quote_amount) } : null,
        note: r.note,
        distanceKm: r.distance_km == null ? null : Math.round(r.distance_km * 10) / 10,
        respondedAt: iso(r.responded_at),
        conversationId: r.conversation_id,
        worker: {
          id: r.worker_id,
          fullName: r.full_name,
          avatarUrl: r.avatar_url,
          experienceYears: r.experience_years,
          locality: r.locality,
          verificationStatus: r.verification_status,
          hourlyRate: num(r.hourly_rate),
          visitCharge: num(r.visit_charge),
          baseRate: num(r.base_rate),
          pricingBasis: r.pricing_basis,
          completedJobsCount: r.completed_jobs_count,
          rating: r.review_count ? Math.round(r.avg_rating * 10) / 10 : null,
          reviewCount: r.review_count,
          isDemoProfile: r.is_demo_profile,
        },
      })),
  };
}

export async function cancelRequest(db: Db, actor: Actor, id: string) {
  await db.transaction(async (tx) => {
    const req = await loadOwnRequest(tx, actor, id, true);
    if (req.status !== 'open') throw conflict('invalid_status');
    await tx.query(`UPDATE service_requests SET status = 'cancelled', updated_at = NOW() WHERE id = $1`, [id]);
    const { rows } = await tx.query(
      `SELECT wp.user_id FROM service_request_workers m JOIN worker_profiles wp ON wp.id = m.worker_id
        WHERE m.request_id = $1 AND m.status = 'interested'`,
      [id],
    );
    for (const r of rows) await notify(tx, r.user_id, 'request_closed', { category: req.category_slug }, '/worker/alerts');
  });
}

// ---------------------------------------------------------------------------
// Worker side: job alerts
// ---------------------------------------------------------------------------
export async function listAlertsForWorker(db: Db, actor: Actor & { workerId: string }) {
  await expireStale(db);
  const { rows } = await db.query(
    `SELECT m.id AS match_id, m.status AS match_status, m.quote_price_type, m.quote_amount, m.note, m.distance_km, m.created_at AS alerted_at,
            sr.*, c.id AS conversation_id
       FROM service_request_workers m
       JOIN service_requests sr ON sr.id = m.request_id
       LEFT JOIN conversations c ON c.request_match_id = m.id
      WHERE m.worker_id = $1 AND (sr.status = 'open' OR m.status = 'selected')
      ORDER BY sr.preferred_start ASC LIMIT 100`,
    [actor.workerId],
  );
  return rows.map((r) => ({
    matchId: r.match_id,
    matchStatus: r.match_status,
    distanceKm: r.distance_km == null ? null : Math.round(r.distance_km * 10) / 10,
    quote: r.quote_amount ? { priceType: r.quote_price_type, amount: Number(r.quote_amount) } : null,
    note: r.note,
    alertedAt: iso(r.alerted_at),
    conversationId: r.conversation_id,
    // Workers see the locality, never the house address, until they are booked.
    request: requestDto(r, false),
  }));
}

export const respondSchema = z.object({
  decision: z.enum(['interested', 'declined']),
  quotePriceType: z.enum(PRICE_TYPES).optional(),
  quoteAmount: z.number().positive().max(1_000_000).optional(),
  note: z.string().trim().max(500).optional(),
});

export async function respondToAlert(db: Db, actor: Actor & { workerId: string }, matchId: string, input: z.infer<typeof respondSchema>) {
  if (!uuid.safeParse(matchId).success) throw notFound();
  if ((input.quoteAmount && !input.quotePriceType) || (!input.quoteAmount && input.quotePriceType)) {
    throw badRequest('validation_failed', { quoteAmount: 'invalid' });
  }
  return db.transaction(async (tx) => {
    const { rows } = await tx.query(
      `SELECT m.*, sr.status AS request_status, sr.customer_id, sr.category_slug FROM service_request_workers m
         JOIN service_requests sr ON sr.id = m.request_id WHERE m.id = $1 FOR UPDATE OF m`,
      [matchId],
    );
    const m = rows[0];
    if (!m || m.worker_id !== actor.workerId) throw notFound();
    if (m.request_status !== 'open') throw conflict('request_closed');
    if (!['notified', 'interested'].includes(m.status)) throw conflict('invalid_status');
    await tx.query(
      `UPDATE service_request_workers SET status = $2, quote_price_type = $3, quote_amount = $4, note = $5, responded_at = NOW() WHERE id = $1`,
      [matchId, input.decision, input.quotePriceType || null, input.quoteAmount || null, input.note || null],
    );
    let conversationId: string | null = null;
    if (input.decision === 'interested') {
      conversationId = await ensureConversation(tx, { requestMatchId: matchId }, [m.customer_id, actor.id]);
      await systemMessage(tx, conversationId, 'sys.worker_interested', {
        amount: input.quoteAmount || null,
        priceType: input.quotePriceType || null,
        note: input.note || null,
      }, { senderId: actor.id });
      await notify(tx, m.customer_id, 'worker_interested', { worker: actor.name, category: m.category_slug }, `/requests/${m.request_id}`);
    }
    return { conversationId };
  });
}

/** Worker can see a request's photos only if they were alerted for it. */
export async function canViewRequestPhotos(db: Db, actor: Actor, requestId: string) {
  if (!uuid.safeParse(requestId).success) return false;
  const { rows } = await db.query(
    `SELECT 1 FROM service_requests sr WHERE sr.id = $1 AND (sr.customer_id = $2 OR $3 = 'admin'
        OR EXISTS (SELECT 1 FROM service_request_workers m WHERE m.request_id = sr.id AND m.worker_id = $4))`,
    [requestId, actor.id, actor.role, actor.workerId],
  );
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Customer selects an interested worker → booking (time reserved atomically)
// ---------------------------------------------------------------------------
export async function selectWorker(db: Db, actor: Actor, requestId: string, matchId: string) {
  if (!uuid.safeParse(matchId).success) throw notFound();
  try {
    return await db.transaction(async (tx) => {
      const req = await loadOwnRequest(tx, actor, requestId, true);
      if (req.customer_id !== actor.id) throw notFound();
      if (req.status !== 'open') throw conflict('request_closed');
      const { rows } = await tx.query(
        `SELECT m.*, wp.user_id, wp.category_slug, wp.safeguarding_hold FROM service_request_workers m
           JOIN worker_profiles wp ON wp.id = m.worker_id WHERE m.id = $1 AND m.request_id = $2 FOR UPDATE OF m`,
        [matchId, requestId],
      );
      const m = rows[0];
      if (!m) throw notFound();
      if (m.status !== 'interested') throw conflict('worker_not_interested');
      if (await isBlockedEitherWay(tx, actor.id, m.user_id)) throw forbidden('blocked');
      await tx.query('SELECT id FROM worker_profiles WHERE id = $1 FOR UPDATE', [m.worker_id]);
      await assertEligible(tx, { id: m.worker_id, category_slug: m.category_slug, safeguarding_hold: m.safeguarding_hold });
      const start = new Date(req.preferred_start);
      const end = new Date(req.preferred_end);
      if (start <= new Date()) throw conflict('booking_in_past');
      if (!(await isWorkerFree(tx, m.worker_id, start, end))) throw conflict('slot_unavailable');

      const catRow = await tx.query('SELECT name FROM service_categories WHERE slug = $1', [req.category_slug]);
      const hold = new Date(Math.min(Date.now() + 24 * 3600_000, start.getTime()));
      const ins = await tx.query(
        `INSERT INTO bookings(booking_number, customer_id, worker_id, service_category_slug, service_title, status,
            scheduled_date, scheduled_time_slot, starts_at, ends_at, address_house, address_locality, address_city,
            address_pincode, address_landmark, job_description, pricing_basis, price_type, indicative_amount,
            service_request_id, hold_expires_at)
         VALUES ($1, $2, $3, $4, $5, 'accepted', ($6::timestamptz AT TIME ZONE 'Asia/Kolkata')::date, $7, $6, $8, $9, $10, $11,
                 $12, $13, $14, $15, $16, $17, $18, $19) RETURNING id`,
        [
          referenceNumber('KS'),
          actor.id,
          m.worker_id,
          req.category_slug,
          catRow.rows[0]?.name || req.category_slug,
          start,
          `${start.toISOString()}/${end.toISOString()}`,
          end,
          req.address_house,
          req.locality_text,
          req.city,
          req.address_pincode,
          req.address_landmark,
          req.problem,
          m.quote_price_type ? PRICE_BASIS[m.quote_price_type as PriceType] : 'quoted',
          m.quote_price_type || req.preferred_price_type,
          m.quote_amount,
          requestId,
          hold,
        ],
      );
      const bookingId: string = ins.rows[0].id;
      await addBookingHistory(tx, bookingId, 'accepted', actor.id, 'selected_from_request');
      await tx.query(`UPDATE service_requests SET status = 'booked', booking_id = $2, updated_at = NOW() WHERE id = $1`, [requestId, bookingId]);
      await tx.query(`UPDATE service_request_workers SET status = 'selected' WHERE id = $1`, [matchId]);
      const others = await tx.query(
        `UPDATE service_request_workers m SET status = 'not_selected' FROM worker_profiles wp
          WHERE m.request_id = $1 AND m.id <> $2 AND m.status = 'interested' AND wp.id = m.worker_id RETURNING wp.user_id`,
        [requestId, matchId],
      );
      for (const o of others.rows) await notify(tx, o.user_id, 'request_closed', { category: req.category_slug }, '/worker/alerts');

      // Continue the same conversation on the booking.
      const conv = await ensureConversation(tx, { requestMatchId: matchId }, [actor.id, m.user_id]);
      await tx.query('UPDATE conversations SET booking_id = $2 WHERE id = $1', [conv, bookingId]);
      await systemMessage(tx, conv, 'sys.worker_selected');
      // The worker's quote becomes an open offer the customer can accept to confirm.
      if (m.quote_amount) {
        const off = await tx.query(
          `INSERT INTO price_offers(booking_id, proposed_by, price_type, amount, note) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [bookingId, m.user_id, m.quote_price_type, m.quote_amount, m.note],
        );
        await systemMessage(tx, conv, 'sys.offer_proposed', { amount: Number(m.quote_amount), priceType: m.quote_price_type, by: 'worker' }, {
          kind: 'offer',
          senderId: m.user_id,
          offerId: off.rows[0].id,
        });
      }
      await notify(tx, m.user_id, 'worker_selected', { category: req.category_slug, start: start.toISOString() }, `/bookings/${bookingId}`);
      return { bookingId };
    });
  } catch (e) {
    if (isExclusionViolation(e)) throw conflict('slot_unavailable');
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Photos (JPEG/PNG/WebP, ≤ 2 MB each, ≤ 3 per request; type checked by magic bytes)
// ---------------------------------------------------------------------------
function sniffImage(buf: Buffer): string | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
}

export async function addRequestPhoto(db: Db, actor: Actor, requestId: string, data: Buffer) {
  if (data.length === 0 || data.length > 2 * 1024 * 1024) throw badRequest('photo_too_large');
  const mime = sniffImage(data);
  if (!mime) throw badRequest('photo_bad_type');
  return db.transaction(async (tx) => {
    const req = await loadOwnRequest(tx, actor, requestId, true);
    if (req.customer_id !== actor.id) throw notFound();
    const { rows } = await tx.query('SELECT COUNT(*)::int AS n FROM service_request_photos WHERE request_id = $1', [requestId]);
    if (rows[0].n >= 3) throw badRequest('photo_limit');
    const ins = await tx.query(
      'INSERT INTO service_request_photos(request_id, mime_type, size_bytes, data) VALUES ($1, $2, $3, $4) RETURNING id',
      [requestId, mime, data.length, data],
    );
    return { id: ins.rows[0].id };
  });
}

export async function getRequestPhoto(db: Db, actor: Actor, requestId: string, photoId: string) {
  if (!uuid.safeParse(photoId).success || !(await canViewRequestPhotos(db, actor, requestId))) throw notFound();
  const { rows } = await db.query('SELECT mime_type, data FROM service_request_photos WHERE id = $1 AND request_id = $2', [photoId, requestId]);
  if (!rows[0]) throw notFound();
  return { mime: rows[0].mime_type as string, data: Buffer.from(rows[0].data) };
}

export async function listRequestPhotoIds(db: Db, actor: Actor, requestId: string) {
  if (!(await canViewRequestPhotos(db, actor, requestId))) throw notFound();
  const { rows } = await db.query('SELECT id FROM service_request_photos WHERE request_id = $1 ORDER BY created_at', [requestId]);
  return rows.map((r) => r.id as string);
}
