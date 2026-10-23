/**
 * Domain rules shared by the server (enforcement) and the client (display).
 * The server is always the authority; the client only mirrors these rules.
 */
import type { ServiceCategorySlug } from '@/types';

export const PRICE_TYPES = ['hourly', 'visit', 'fixed'] as const;
export type PriceType = (typeof PRICE_TYPES)[number];

export const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'temporary', 'contract', 'daily_wage'] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const PAY_PERIODS = ['hour', 'day', 'week', 'month'] as const;
export type PayPeriod = (typeof PAY_PERIODS)[number];

export const APPLICATION_STATUSES = [
  'submitted', 'viewed', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'withdrawn',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Statuses in which a booking reserves the worker's time. */
export const RESERVING_STATUSES = ['accepted', 'confirmed', 'in_progress'] as const;

export const CHECK_TYPES = [
  'phone', 'identity', 'address', 'reference', 'skill', 'first_aid', 'police', 'safeguarding_training',
] as const;
export type CheckType = (typeof CHECK_TYPES)[number];
export type CheckStatus = 'not_started' | 'pending' | 'passed' | 'failed' | 'expired';

export interface RequiredCheck {
  type: CheckType;
  slot: number;
  /** Months a passed check stays valid; the reviewer must set an expiry date. */
  validMonths?: number;
}

export interface VerificationPolicy {
  /** All must be passed (and unexpired) before the worker can be booked in this category. */
  required: RequiredCheck[];
  /** Offered to the worker, shown on the profile when passed, never mandatory. */
  optional: CheckType[];
}

const GENERAL: VerificationPolicy = { required: [], optional: ['identity', 'skill', 'reference'] };
const DOMESTIC: VerificationPolicy = { required: [], optional: ['identity', 'reference', 'address'] };
const CHILDCARE: VerificationPolicy = {
  required: [
    { type: 'identity', slot: 1 },
    { type: 'reference', slot: 1, validMonths: 24 },
    { type: 'reference', slot: 2, validMonths: 24 },
    { type: 'police', slot: 1, validMonths: 12 },
    { type: 'first_aid', slot: 1, validMonths: 24 },
    { type: 'safeguarding_training', slot: 1, validMonths: 24 },
  ],
  optional: ['address'],
};

export function verificationPolicy(category: ServiceCategorySlug | string): VerificationPolicy {
  if (category === 'childcare') return CHILDCARE;
  if (category === 'maid-housekeeping' || category === 'cook') return DOMESTIC;
  return GENERAL;
}

export interface CheckRow {
  check_type: string;
  slot: number;
  status: string;
  expires_at: string | Date | null;
}

export function isCheckValid(c: CheckRow | undefined, now = new Date()): boolean {
  if (!c || c.status !== 'passed') return false;
  return !c.expires_at || new Date(c.expires_at) > now;
}

export function evaluateEligibility(
  category: string,
  checks: CheckRow[],
  safeguardingHold: boolean,
  now = new Date(),
) {
  const policy = verificationPolicy(category);
  const missing = policy.required.filter(
    (r) => !isCheckValid(checks.find((c) => c.check_type === r.type && c.slot === r.slot), now),
  );
  const holdBlocks = safeguardingHold && policy.required.length > 0;
  return { eligible: missing.length === 0 && !holdBlocks, missing, onHold: safeguardingHold };
}

/** Summary stored on worker_profiles.verification_status (display only). */
export function summariseVerification(checks: CheckRow[], now = new Date()) {
  if (isCheckValid(checks.find((c) => c.check_type === 'identity'), now)) return 'verified';
  if (checks.some((c) => c.status === 'pending')) return 'pending';
  return 'unverified';
}

// ---------- India Standard Time helpers (IST has no daylight saving) ----------
const IST_OFFSET_MIN = 330;

function toIst(d: Date) {
  return new Date(d.getTime() + IST_OFFSET_MIN * 60_000);
}

/** 0 = Sunday, in IST. */
export function istWeekday(d: Date) {
  return toIst(d).getUTCDay();
}

export function istMinuteOfDay(d: Date) {
  const t = toIst(d);
  return t.getUTCHours() * 60 + t.getUTCMinutes();
}

/** YYYY-MM-DD in IST. */
export function istDate(d: Date) {
  return toIst(d).toISOString().slice(0, 10);
}

/** Build a Date from an IST calendar date and minute of day. */
export function istToDate(date: string, minuteOfDay: number) {
  const hh = String(Math.floor(minuteOfDay / 60)).padStart(2, '0');
  const mm = String(minuteOfDay % 60).padStart(2, '0');
  return new Date(`${date}T${hh}:${mm}:00+05:30`);
}

export function minutesToLabel(m: number) {
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(min).padStart(2, '0')} ${suffix}`;
}

export interface WorkingBlock {
  weekday: number;
  startMinute: number;
  endMinute: number;
}

/**
 * True when [start, end) lies entirely inside one working block on its IST day.
 * Workers who have not set hours yet are treated as "hours not set" (allowed),
 * and the UI says so instead of claiming they are available.
 */
export function withinWorkingHours(blocks: WorkingBlock[], start: Date, end: Date) {
  if (blocks.length === 0) return true;
  if (istDate(start) !== istDate(new Date(end.getTime() - 1))) return false;
  const wd = istWeekday(start);
  const s = istMinuteOfDay(start);
  const e = s + Math.round((end.getTime() - start.getTime()) / 60_000);
  return blocks.some((b) => b.weekday === wd && b.startMinute <= s && b.endMinute >= e);
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

/** Merge intervals so viewers learn only "busy", never how many bookings or why. */
export function mergeIntervals(intervals: { start: Date; end: Date }[]) {
  const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());
  const out: { start: Date; end: Date }[] = [];
  for (const i of sorted) {
    const last = out[out.length - 1];
    if (last && i.start <= last.end) {
      if (i.end > last.end) last.end = i.end;
    } else out.push({ start: new Date(i.start), end: new Date(i.end) });
  }
  return out;
}
