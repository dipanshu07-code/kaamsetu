import { z } from 'zod';
import { Db, Queryable } from '../db';
import { Actor } from '../auth';
import { badRequest, conflict, notFound } from '../errors';
import {
  evaluateEligibility,
  istDate,
  mergeIntervals,
  overlaps,
  withinWorkingHours,
  WorkingBlock,
  CheckRow,
  PRICE_TYPES,
} from '@/lib/domain';
import { iso, num, uuid } from './common';

// ---------------------------------------------------------------------------
// Availability primitives (used for discovery, booking and request matching)
// ---------------------------------------------------------------------------

export async function loadWorkingBlocks(q: Queryable, workerIds: string[]) {
  const map = new Map<string, WorkingBlock[]>();
  if (!workerIds.length) return map;
  const { rows } = await q.query(
    `SELECT worker_id, weekday, start_minute, end_minute FROM worker_availability
      WHERE worker_id = ANY($1::uuid[]) AND weekday IS NOT NULL AND is_active`,
    [workerIds],
  );
  for (const r of rows) {
    const list = map.get(r.worker_id) || [];
    list.push({ weekday: r.weekday, startMinute: r.start_minute, endMinute: r.end_minute });
    map.set(r.worker_id, list);
  }
  return map;
}

/** Busy intervals (reserving bookings + time off) for workers within a window. */
export async function loadBusy(q: Queryable, workerIds: string[], from: Date, to: Date, excludeBookingId?: string) {
  const map = new Map<string, { start: Date; end: Date }[]>();
  if (!workerIds.length) return map;
  const { rows } = await q.query(
    `SELECT worker_id, starts_at, ends_at FROM bookings
      WHERE worker_id = ANY($1::uuid[]) AND status IN ('accepted', 'confirmed', 'in_progress')
        AND starts_at < $3 AND ends_at > $2 AND ($4::uuid IS NULL OR id <> $4)
     UNION ALL
     SELECT worker_id, starts_at, ends_at FROM worker_time_off
      WHERE worker_id = ANY($1::uuid[]) AND starts_at < $3 AND ends_at > $2`,
    [workerIds, from, to, excludeBookingId || null],
  );
  for (const r of rows) {
    const list = map.get(r.worker_id) || [];
    list.push({ start: new Date(r.starts_at), end: new Date(r.ends_at) });
    map.set(r.worker_id, list);
  }
  return map;
}

export type SlotState = 'available' | 'unavailable' | 'hours_not_set';

export async function slotStates(q: Queryable, workerIds: string[], start: Date, end: Date, excludeBookingId?: string) {
  const blocks = await loadWorkingBlocks(q, workerIds);
  const busy = await loadBusy(q, workerIds, start, end, excludeBookingId);
  const out = new Map<string, SlotState>();
  for (const id of workerIds) {
    const b = blocks.get(id) || [];
    const isBusy = (busy.get(id) || []).some((i) => overlaps(start, end, i.start, i.end));
    if (isBusy || !withinWorkingHours(b, start, end)) out.set(id, 'unavailable');
    else out.set(id, b.length ? 'available' : 'hours_not_set');
  }
  return out;
}

export async function isWorkerFree(q: Queryable, workerId: string, start: Date, end: Date, excludeBookingId?: string) {
  const state = (await slotStates(q, [workerId], start, end, excludeBookingId)).get(workerId);
  return state !== 'unavailable';
}

export async function loadChecks(q: Queryable, workerIds: string[]) {
  const map = new Map<string, CheckRow[]>();
  if (!workerIds.length) return map;
  const { rows } = await q.query(
    `SELECT worker_id, check_type, slot, status, expires_at FROM verification_checks WHERE worker_id = ANY($1::uuid[])`,
    [workerIds],
  );
  for (const r of rows) {
    const list = map.get(r.worker_id) || [];
    list.push(r);
    map.set(r.worker_id, list);
  }
  return map;
}

/** Server-side gate: may this worker be booked/matched in their category right now? */
export async function assertEligible(q: Queryable, worker: { id: string; category_slug: string; safeguarding_hold: boolean }) {
  const checks = (await loadChecks(q, [worker.id])).get(worker.id) || [];
  const result = evaluateEligibility(worker.category_slug, checks, worker.safeguarding_hold);
  if (!result.eligible) throw conflict('worker_not_eligible');
}

// ---------------------------------------------------------------------------
// Public DTO — never includes phone numbers, exact addresses or user ids.
// ---------------------------------------------------------------------------

const WORKER_SELECT = `
  wp.id, wp.full_name, wp.full_name_hi, wp.avatar_url, wp.category_slug, wp.subcategories, wp.experience_years,
  wp.city, wp.locality, wp.locality_id, wp.service_radius_km, wp.languages, wp.is_available_today, wp.pricing_basis,
  wp.base_rate, wp.hourly_rate, wp.visit_charge, wp.headline, wp.bio, wp.bio_hi, wp.skills, wp.verification_status,
  wp.completed_jobs_count, wp.is_demo_profile, wp.accepts_on_demand, wp.open_to_jobs, wp.safeguarding_hold,
  wp.preferred_locality_ids, l.lat, l.lng,
  rv.avg_rating, rv.review_count`;

const WORKER_FROM = `
  FROM worker_profiles wp
  JOIN users u ON u.id = wp.user_id AND u.deleted_at IS NULL AND NOT u.is_suspended AND u.is_active
  JOIN service_categories c ON c.slug = wp.category_slug
  LEFT JOIN localities l ON l.id = wp.locality_id
  LEFT JOIN LATERAL (SELECT AVG(r.rating)::float AS avg_rating, COUNT(*)::int AS review_count
                       FROM reviews r WHERE r.worker_id = wp.id) rv ON TRUE`;

function publicWorker(r: any, checks: CheckRow[] = []) {
  const passed = checks.filter((c) => c.status === 'passed' && (!c.expires_at || new Date(c.expires_at) > new Date()));
  const eligibility = evaluateEligibility(r.category_slug, checks, r.safeguarding_hold);
  return {
    id: r.id,
    fullName: r.full_name,
    fullNameHi: r.full_name_hi,
    avatarUrl: r.avatar_url,
    category: r.category_slug,
    subcategories: r.subcategories || [],
    experienceYears: r.experience_years,
    city: r.city,
    locality: r.locality,
    serviceRadiusKm: r.service_radius_km,
    languages: r.languages || [],
    isAvailableToday: r.is_available_today,
    pricingBasis: r.pricing_basis,
    baseRate: num(r.base_rate),
    hourlyRate: num(r.hourly_rate),
    visitCharge: num(r.visit_charge),
    headline: r.headline,
    bio: r.bio,
    bioHi: r.bio_hi,
    skills: r.skills || [],
    verificationStatus: r.verification_status,
    passedChecks: Array.from(new Set(passed.map((c) => c.check_type))),
    eligibleForCategory: eligibility.eligible,
    rating: r.review_count ? Math.round(r.avg_rating * 10) / 10 : null,
    reviewCount: r.review_count || 0,
    completedJobsCount: r.completed_jobs_count || 0,
    isDemoProfile: r.is_demo_profile,
    acceptsOnDemand: r.accepts_on_demand,
    openToJobs: r.open_to_jobs,
  };
}

export type PublicWorker = ReturnType<typeof publicWorker> & {
  distanceKm: number | null;
  slot: SlotState | null;
  localityMatch: boolean;
};

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

export const searchSchema = z.object({
  category: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  localityId: uuid.optional(),
  q: z.string().max(100).optional(),
  // Browser location (optional). Rounded before use; never stored.
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  maxKm: z.coerce.number().min(1).max(100).optional(),
  priceType: z.enum(PRICE_TYPES).optional(),
  minExperience: z.coerce.number().int().min(0).max(60).optional(),
  verifiedOnly: z.coerce.boolean().optional(),
  availableToday: z.coerce.boolean().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startMinute: z.coerce.number().int().min(0).max(1439).optional(),
  durationMinutes: z.coerce.number().int().min(30).max(720).optional(),
  onlyAvailable: z.coerce.boolean().optional(),
});

export async function searchWorkers(db: Db, f: z.infer<typeof searchSchema>) {
  let origin: { lat: number; lng: number; localityId?: string; name?: string } | null = null;
  if (f.localityId) {
    const { rows } = await db.query('SELECT id, name, city, lat, lng FROM localities WHERE id = $1', [f.localityId]);
    if (rows[0]) {
      origin = { lat: rows[0].lat, lng: rows[0].lng, localityId: rows[0].id, name: rows[0].name };
      if (!f.city) f.city = rows[0].city;
    }
  } else if (f.lat !== undefined && f.lng !== undefined) {
    origin = { lat: Math.round(f.lat * 100) / 100, lng: Math.round(f.lng * 100) / 100 };
  }
  const hasCoords = origin && origin.lat != null && origin.lng != null;

  const params: unknown[] = [];
  const where: string[] = ['c.is_enabled'];
  const p = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };
  if (f.category) where.push(`wp.category_slug = ${p(f.category)}`);
  if (f.city && !(hasCoords && !f.localityId)) where.push(`wp.city = ${p(f.city)}`);
  if (f.minExperience) where.push(`wp.experience_years >= ${p(f.minExperience)}`);
  if (f.verifiedOnly) where.push(`wp.verification_status = 'verified'`);
  if (f.availableToday) where.push('wp.is_available_today');
  if (f.priceType === 'hourly') where.push(`(wp.hourly_rate IS NOT NULL OR wp.pricing_basis = 'per-hour')`);
  if (f.priceType === 'visit') where.push(`(wp.visit_charge IS NOT NULL OR wp.pricing_basis = 'per-visit')`);
  if (f.priceType === 'fixed') where.push(`wp.pricing_basis = 'quoted'`);
  if (f.q) {
    const like = p(`%${f.q.replace(/[%_\\]/g, (m) => '\\' + m)}%`);
    where.push(`(wp.full_name ILIKE ${like} OR wp.locality ILIKE ${like} OR array_to_string(wp.skills, ' ') ILIKE ${like}
                 OR array_to_string(wp.subcategories, ' ') ILIKE ${like} OR c.name ILIKE ${like})`);
  }
  const distExpr = hasCoords ? `km_between(${p(origin!.lat)}, ${p(origin!.lng)}, l.lat, l.lng)` : 'NULL::float';

  const { rows } = await db.query(
    `SELECT ${WORKER_SELECT}, ${distExpr} AS distance_km ${WORKER_FROM}
      WHERE ${where.join(' AND ')} LIMIT 300`,
    params,
  );

  const ids = rows.map((r) => r.id);
  const checks = await loadChecks(db, ids);

  let slots: Map<string, SlotState> | null = null;
  if (f.date && f.startMinute !== undefined) {
    const start = new Date(`${f.date}T00:00:00+05:30`);
    start.setTime(start.getTime() + f.startMinute * 60_000);
    const end = new Date(start.getTime() + (f.durationMinutes || 120) * 60_000);
    slots = await slotStates(db, ids, start, end);
  }

  let results: PublicWorker[] = rows.map((r) => ({
    ...publicWorker(r, checks.get(r.id)),
    distanceKm: r.distance_km == null ? null : Math.round(r.distance_km * 10) / 10,
    slot: slots ? slots.get(r.id)! : null,
    localityMatch: !!origin?.localityId && (r.locality_id === origin.localityId || (r.preferred_locality_ids || []).includes(origin.localityId)),
  }));

  // Childcare (and any category with mandatory checks) only shows eligible workers.
  results = results.filter((w) => w.eligibleForCategory);
  if (f.maxKm && hasCoords) {
    results = results.filter((w) => (w.distanceKm != null ? w.distanceKm <= f.maxKm! : w.localityMatch));
  }
  if (f.onlyAvailable && slots) results = results.filter((w) => w.slot !== 'unavailable');

  const slotRank = (s: SlotState | null) => (s === 'available' ? 0 : s === 'hours_not_set' || s === null ? 1 : 2);
  results.sort(
    (a, b) =>
      slotRank(a.slot) - slotRank(b.slot) ||
      Number(b.localityMatch) - Number(a.localityMatch) ||
      (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9) ||
      Number(b.isAvailableToday) - Number(a.isAvailableToday) ||
      Number(b.verificationStatus === 'verified') - Number(a.verificationStatus === 'verified') ||
      b.experienceYears - a.experienceYears,
  );
  return { workers: results.slice(0, 60), distanceUsed: !!hasCoords, total: results.length };
}

export async function getWorkerRow(q: Queryable, workerId: string) {
  if (!uuid.safeParse(workerId).success) return null;
  const { rows } = await q.query(`SELECT ${WORKER_SELECT}, wp.user_id ${WORKER_FROM} WHERE wp.id = $1`, [workerId]);
  return rows[0] || null;
}

export async function getWorkerPublic(db: Db, workerId: string) {
  const r = await getWorkerRow(db, workerId);
  if (!r) throw notFound();
  const checks = (await loadChecks(db, [r.id])).get(r.id) || [];
  const [rateCards, reviews, experience, history, category] = await Promise.all([
    db.query('SELECT id, service_title, pricing_basis, amount, description FROM rate_cards WHERE worker_id = $1 ORDER BY amount', [r.id]),
    db.query(
      `SELECT rv.id, rv.rating, rv.punctuality_rating, rv.work_quality_rating, rv.politeness_rating, rv.comment, rv.created_at,
              split_part(u.full_name, ' ', 1) AS first_name, b.address_locality
         FROM reviews rv JOIN users u ON u.id = rv.customer_id JOIN bookings b ON b.id = rv.booking_id
        WHERE rv.worker_id = $1 ORDER BY rv.created_at DESC LIMIT 30`,
      [r.id],
    ),
    db.query('SELECT id, role_title, employer_name, locality, start_month, end_month, description FROM worker_experience WHERE worker_id = $1 ORDER BY start_month DESC', [r.id]),
    db.query('SELECT id, project_title, locality, completion_date, customer_rating FROM work_history WHERE worker_id = $1 ORDER BY completion_date DESC LIMIT 20', [r.id]),
    db.query('SELECT is_enabled FROM service_categories WHERE slug = $1', [r.category_slug]),
  ]);
  return {
    ...publicWorker(r, checks),
    categoryEnabled: !!category.rows[0]?.is_enabled,
    rateCards: rateCards.rows.map((c) => ({
      id: c.id,
      serviceTitle: c.service_title,
      pricingBasis: c.pricing_basis,
      amount: Number(c.amount),
      description: c.description,
    })),
    reviews: reviews.rows.map((v) => ({
      id: v.id,
      rating: v.rating,
      punctuality: v.punctuality_rating,
      quality: v.work_quality_rating,
      politeness: v.politeness_rating,
      comment: v.comment,
      createdAt: iso(v.created_at),
      customerFirstName: v.first_name,
      locality: v.address_locality,
    })),
    experience: experience.rows.map(mapExperience),
    workHistory: history.rows.map((h) => ({
      id: h.id,
      title: h.project_title,
      locality: h.locality,
      completedOn: h.completion_date ? istDate(new Date(h.completion_date)) : null,
      rating: h.customer_rating,
    })),
  };
}

function mapExperience(e: any) {
  return {
    id: e.id,
    roleTitle: e.role_title,
    employerName: e.employer_name,
    locality: e.locality,
    startMonth: e.start_month ? istDate(new Date(e.start_month)).slice(0, 7) : null,
    endMonth: e.end_month ? istDate(new Date(e.end_month)).slice(0, 7) : null,
    description: e.description,
  };
}

/** Public calendar: working hours + merged busy blocks, nothing else. */
export async function getAvailability(db: Db, workerId: string, fromDate: string | null, days: number) {
  const r = await getWorkerRow(db, workerId);
  if (!r) throw notFound();
  const from = new Date(`${fromDate || istDate(new Date())}T00:00:00+05:30`);
  const to = new Date(from.getTime() + Math.min(Math.max(days, 1), 21) * 86400_000);
  const blocks = (await loadWorkingBlocks(db, [r.id])).get(r.id) || [];
  const busy = (await loadBusy(db, [r.id], from, to)).get(r.id) || [];
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    hoursSet: blocks.length > 0,
    workingHours: blocks,
    unavailable: mergeIntervals(busy).map((i) => ({ start: i.start.toISOString(), end: i.end.toISOString() })),
  };
}

// ---------------------------------------------------------------------------
// Worker self-service (only whitelisted fields can be changed)
// ---------------------------------------------------------------------------

export async function getMyWorkerProfile(db: Db, actor: Actor & { workerId: string }) {
  const pub = await getWorkerPublic(db, actor.workerId);
  const { rows } = await db.query(
    `SELECT preferred_locality_ids, locality_id, profile_assisted_by, safeguarding_hold FROM worker_profiles WHERE id = $1`,
    [actor.workerId],
  );
  const timeOff = await db.query(
    `SELECT id, starts_at, ends_at, kind, note FROM worker_time_off WHERE worker_id = $1 AND ends_at > NOW() ORDER BY starts_at`,
    [actor.workerId],
  );
  const blocks = (await loadWorkingBlocks(db, [actor.workerId])).get(actor.workerId) || [];
  return {
    ...pub,
    localityId: rows[0].locality_id,
    preferredLocalityIds: rows[0].preferred_locality_ids || [],
    assistedBy: rows[0].profile_assisted_by,
    safeguardingHold: rows[0].safeguarding_hold,
    workingHours: blocks,
    timeOff: timeOff.rows.map((t) => ({ id: t.id, start: iso(t.starts_at), end: iso(t.ends_at), kind: t.kind, note: t.note })),
  };
}

export const updateProfileSchema = z.object({
  headline: z.string().trim().max(160).nullable().optional(),
  bio: z.string().trim().max(2000).nullable().optional(),
  categorySlug: z.string().max(50).optional(),
  subcategories: z.array(z.string().trim().min(1).max(80)).max(15).optional(),
  skills: z.array(z.string().trim().min(1).max(60)).max(25).optional(),
  languages: z.array(z.string().trim().min(1).max(40)).max(8).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
  localityId: uuid.nullable().optional(),
  localityText: z.string().trim().min(2).max(150).optional(),
  city: z.string().trim().min(2).max(100).optional(),
  preferredLocalityIds: z.array(uuid).max(20).optional(),
  serviceRadiusKm: z.number().int().min(1).max(100).optional(),
  acceptsOnDemand: z.boolean().optional(),
  openToJobs: z.boolean().optional(),
  isAvailableToday: z.boolean().optional(),
  pricingBasis: z.enum(['per-visit', 'per-hour', 'per-day', 'per-month', 'quoted']).optional(),
  baseRate: z.number().min(0).max(1_000_000).optional(),
  hourlyRate: z.number().min(0).max(100_000).nullable().optional(),
  visitCharge: z.number().min(0).max(100_000).nullable().optional(),
  rateCards: z
    .array(
      z.object({
        serviceTitle: z.string().trim().min(2).max(150),
        pricingBasis: z.enum(['per-visit', 'per-hour', 'per-day', 'per-month', 'quoted']),
        amount: z.number().min(0).max(1_000_000),
        description: z.string().trim().max(500).optional(),
      }),
    )
    .max(12)
    .optional(),
});

export async function updateMyWorkerProfile(db: Db, actor: Actor & { workerId: string }, input: z.infer<typeof updateProfileSchema>) {
  await db.transaction(async (tx) => {
    const sets: string[] = [];
    const params: unknown[] = [actor.workerId];
    const set = (col: string, v: unknown) => {
      params.push(v);
      sets.push(`${col} = $${params.length}`);
    };
    if (input.headline !== undefined) set('headline', input.headline);
    if (input.bio !== undefined) set('bio', input.bio);
    if (input.subcategories) set('subcategories', input.subcategories);
    if (input.skills) set('skills', input.skills);
    if (input.languages) set('languages', input.languages);
    if (input.experienceYears !== undefined) set('experience_years', input.experienceYears);
    if (input.serviceRadiusKm !== undefined) set('service_radius_km', input.serviceRadiusKm);
    if (input.acceptsOnDemand !== undefined) set('accepts_on_demand', input.acceptsOnDemand);
    if (input.openToJobs !== undefined) set('open_to_jobs', input.openToJobs);
    if (input.isAvailableToday !== undefined) set('is_available_today', input.isAvailableToday);
    if (input.pricingBasis) set('pricing_basis', input.pricingBasis);
    if (input.baseRate !== undefined) set('base_rate', input.baseRate);
    if (input.hourlyRate !== undefined) set('hourly_rate', input.hourlyRate);
    if (input.visitCharge !== undefined) set('visit_charge', input.visitCharge);
    if (input.categorySlug) {
      const { rows } = await tx.query('SELECT slug FROM service_categories WHERE slug = $1', [input.categorySlug]);
      if (!rows[0]) throw badRequest('validation_failed', { categorySlug: 'invalid' });
      set('category_slug', input.categorySlug);
    }
    if (input.preferredLocalityIds) {
      const { rows } = await tx.query('SELECT COUNT(*)::int AS n FROM localities WHERE id = ANY($1::uuid[])', [input.preferredLocalityIds]);
      if (rows[0].n !== new Set(input.preferredLocalityIds).size) throw badRequest('validation_failed', { preferredLocalityIds: 'invalid' });
      set('preferred_locality_ids', input.preferredLocalityIds);
    }
    if (input.localityId) {
      const { rows } = await tx.query('SELECT id, name, city FROM localities WHERE id = $1', [input.localityId]);
      if (!rows[0]) throw badRequest('validation_failed', { localityId: 'invalid' });
      set('locality_id', rows[0].id);
      set('locality', rows[0].name);
      set('city', rows[0].city);
    } else if (input.localityText) {
      set('locality_id', null);
      set('locality', input.localityText);
      if (input.city) set('city', input.city);
    }
    if (sets.length) await tx.query(`UPDATE worker_profiles SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $1`, params);
    if (input.rateCards) {
      await tx.query('DELETE FROM rate_cards WHERE worker_id = $1', [actor.workerId]);
      for (const rc of input.rateCards) {
        await tx.query(
          'INSERT INTO rate_cards(worker_id, service_title, pricing_basis, amount, description) VALUES ($1, $2, $3, $4, $5)',
          [actor.workerId, rc.serviceTitle, rc.pricingBasis, rc.amount, rc.description || null],
        );
      }
    }
  });
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const workingHoursSchema = z.object({
  blocks: z
    .array(
      z
        .object({
          weekday: z.number().int().min(0).max(6),
          startMinute: z.number().int().min(0).max(1439),
          endMinute: z.number().int().min(1).max(1440),
        })
        .refine((b) => b.endMinute > b.startMinute, { message: 'invalid_range' }),
    )
    .max(42),
});

export async function setWorkingHours(db: Db, actor: Actor & { workerId: string }, input: z.infer<typeof workingHoursSchema>) {
  // Reject overlapping blocks on the same day.
  for (const a of input.blocks) {
    for (const b of input.blocks) {
      if (a !== b && a.weekday === b.weekday && a.startMinute < b.endMinute && b.startMinute < a.endMinute) {
        throw badRequest('overlapping_hours');
      }
    }
  }
  await db.transaction(async (tx) => {
    await tx.query('DELETE FROM worker_availability WHERE worker_id = $1', [actor.workerId]);
    for (const b of input.blocks) {
      await tx.query(
        `INSERT INTO worker_availability(worker_id, day_of_week, time_slot, weekday, start_minute, end_minute)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [actor.workerId, WEEKDAY_NAMES[b.weekday], `${b.startMinute}-${b.endMinute}`, b.weekday, b.startMinute, b.endMinute],
      );
    }
  });
}

export const timeOffSchema = z
  .object({
    start: z.string().datetime({ offset: true }),
    end: z.string().datetime({ offset: true }),
    kind: z.enum(['blocked', 'break', 'time_off']).default('blocked'),
    note: z.string().trim().max(200).optional(),
  })
  .refine((v) => new Date(v.end) > new Date(v.start), { message: 'invalid_range', path: ['end'] });

export async function addTimeOff(db: Db, actor: Actor & { workerId: string }, input: z.infer<typeof timeOffSchema>) {
  const start = new Date(input.start);
  const end = new Date(input.end);
  if (end.getTime() - start.getTime() > 60 * 86400_000) throw badRequest('range_too_long');
  return db.transaction(async (tx) => {
    // Lock the worker row so a booking cannot be accepted into this range concurrently.
    await tx.query('SELECT id FROM worker_profiles WHERE id = $1 FOR UPDATE', [actor.workerId]);
    const { rows } = await tx.query(
      `SELECT 1 FROM bookings WHERE worker_id = $1 AND status IN ('accepted', 'confirmed', 'in_progress')
         AND starts_at < $3 AND ends_at > $2`,
      [actor.workerId, start, end],
    );
    if (rows.length) throw conflict('conflicts_with_booking');
    const ins = await tx.query(
      'INSERT INTO worker_time_off(worker_id, starts_at, ends_at, kind, note) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [actor.workerId, start, end, input.kind, input.note || null],
    );
    return { id: ins.rows[0].id };
  });
}

export async function deleteTimeOff(db: Db, actor: Actor & { workerId: string }, id: string) {
  if (!uuid.safeParse(id).success) throw notFound();
  const { rows } = await db.query('DELETE FROM worker_time_off WHERE id = $1 AND worker_id = $2 RETURNING id', [id, actor.workerId]);
  if (!rows.length) throw notFound();
}

export const experienceSchema = z.object({
  roleTitle: z.string().trim().min(2).max(120),
  employerName: z.string().trim().max(150).optional(),
  locality: z.string().trim().max(150).optional(),
  startMonth: z.string().regex(/^\d{4}-\d{2}$/),
  endMonth: z.string().regex(/^\d{4}-\d{2}$/).nullable().optional(),
  description: z.string().trim().max(1000).optional(),
});

export async function addExperience(db: Db, actor: Actor & { workerId: string }, e: z.infer<typeof experienceSchema>) {
  if (e.endMonth && e.endMonth < e.startMonth) throw badRequest('validation_failed', { endMonth: 'invalid' });
  const { rows } = await db.query(
    `INSERT INTO worker_experience(worker_id, role_title, employer_name, locality, start_month, end_month, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [actor.workerId, e.roleTitle, e.employerName || null, e.locality || null, `${e.startMonth}-01`, e.endMonth ? `${e.endMonth}-01` : null, e.description || null],
  );
  return { id: rows[0].id };
}

export async function deleteExperience(db: Db, actor: Actor & { workerId: string }, id: string) {
  if (!uuid.safeParse(id).success) throw notFound();
  const { rows } = await db.query('DELETE FROM worker_experience WHERE id = $1 AND worker_id = $2 RETURNING id', [id, actor.workerId]);
  if (!rows.length) throw notFound();
}
