import { z } from 'zod';
import { Db, Queryable } from '../db';
import { Actor } from '../auth';
import { badRequest, conflict, forbidden, notFound } from '../errors';
import {
  CHECK_TYPES,
  evaluateEligibility,
  isCheckValid,
  summariseVerification,
  verificationPolicy,
} from '@/lib/domain';
import { audit, iso, notify, phoneSchema, uuid } from './common';

/**
 * No automated identity/background verification provider is integrated.
 * Until one is configured, checks are recorded by an administrator after an
 * offline process (e.g. original document seen in person, referee phoned).
 * No identity numbers or document copies are ever collected or stored.
 */
export function providerStatus() {
  const name = process.env.VERIFICATION_PROVIDER || null;
  return { configured: false, requestedProvider: name };
}

export const REVIEW_METHODS = [
  'in_person_original_sighted',
  'reference_phone_call',
  'certificate_sighted',
  'police_certificate_sighted',
  'phone_call_confirmed',
  'skill_demonstration',
] as const;

export async function refreshVerificationSummary(q: Queryable, workerId: string) {
  const { rows } = await q.query('SELECT check_type, slot, status, expires_at FROM verification_checks WHERE worker_id = $1', [workerId]);
  await q.query('UPDATE worker_profiles SET verification_status = $2, updated_at = NOW() WHERE id = $1', [workerId, summariseVerification(rows)]);
}

function checkDto(c: any) {
  const expired = c.status === 'passed' && !isCheckValid(c);
  return {
    id: c.id,
    type: c.check_type,
    slot: c.slot,
    status: expired ? 'expired' : c.status,
    consentGivenAt: iso(c.consent_given_at),
    submittedAt: iso(c.submitted_at),
    reviewedAt: iso(c.reviewed_at),
    expiresAt: iso(c.expires_at),
    method: c.method,
  };
}

export async function getMyVerification(db: Db, actor: Actor & { workerId: string }) {
  const [{ rows: w }, { rows }] = await Promise.all([
    db.query('SELECT category_slug, safeguarding_hold FROM worker_profiles WHERE id = $1', [actor.workerId]),
    db.query('SELECT * FROM verification_checks WHERE worker_id = $1 ORDER BY check_type, slot', [actor.workerId]),
  ]);
  const policy = verificationPolicy(w[0].category_slug);
  const eligibility = evaluateEligibility(w[0].category_slug, rows, w[0].safeguarding_hold);
  return {
    category: w[0].category_slug,
    provider: providerStatus(),
    policy,
    eligible: eligibility.eligible,
    missing: eligibility.missing,
    onHold: eligibility.onHold,
    checks: rows.map(checkDto),
  };
}

export const requestCheckSchema = z
  .object({
    type: z.enum(CHECK_TYPES),
    slot: z.number().int().min(1).max(3).default(1),
    consent: z.literal(true),
    note: z.string().trim().max(500).optional(),
    reference: z
      .object({
        name: z.string().trim().min(2).max(120),
        relation: z.string().trim().min(2).max(80),
        phone: phoneSchema,
      })
      .optional(),
  })
  .superRefine((v, ctx) => {
    if (v.type === 'reference' && !v.reference) ctx.addIssue({ code: 'custom', path: ['reference'], message: 'required' });
  });

export async function requestCheck(db: Db, actor: Actor & { workerId: string }, input: z.infer<typeof requestCheckSchema>) {
  const { rows: w } = await db.query('SELECT category_slug FROM worker_profiles WHERE id = $1', [actor.workerId]);
  const policy = verificationPolicy(w[0].category_slug);
  const allowed = new Set<string>([...policy.required.map((r) => r.type), ...policy.optional, 'phone', 'skill']);
  if (!allowed.has(input.type)) throw badRequest('check_not_applicable');
  if (input.slot > 1 && !policy.required.some((r) => r.type === input.type && r.slot === input.slot)) throw badRequest('check_not_applicable');

  await db.transaction(async (tx) => {
    const { rows } = await tx.query(
      'SELECT * FROM verification_checks WHERE worker_id = $1 AND check_type = $2 AND slot = $3 FOR UPDATE',
      [actor.workerId, input.type, input.slot],
    );
    const existing = rows[0];
    if (existing?.status === 'pending') throw conflict('check_already_pending');
    if (existing && isCheckValid(existing)) throw conflict('check_already_passed');
    const ref = input.type === 'reference' ? JSON.stringify(input.reference) : null;
    if (existing) {
      await tx.query(
        `UPDATE verification_checks SET status = 'pending', consent_given_at = NOW(), submitted_at = NOW(), reference_details = $2,
            worker_note = $3, method = NULL, reviewed_by = NULL, reviewed_at = NULL, expires_at = NULL, reviewer_notes = NULL, updated_at = NOW()
          WHERE id = $1`,
        [existing.id, ref, input.note || null],
      );
    } else {
      await tx.query(
        `INSERT INTO verification_checks(worker_id, check_type, slot, status, consent_given_at, submitted_at, reference_details, worker_note)
         VALUES ($1, $2, $3, 'pending', NOW(), NOW(), $4, $5)`,
        [actor.workerId, input.type, input.slot, ref, input.note || null],
      );
    }
    await refreshVerificationSummary(tx, actor.workerId);
  });
}

// ---------- Admin ----------
export async function adminListChecks(db: Db, actor: Actor, status: string = 'pending') {
  if (actor.role !== 'admin') throw forbidden();
  const { rows } = await db.query(
    `SELECT vc.*, wp.full_name, wp.category_slug, wp.locality, wp.city, wp.safeguarding_hold
       FROM verification_checks vc JOIN worker_profiles wp ON wp.id = vc.worker_id
      WHERE ($1 = 'all' OR vc.status = $1) ORDER BY vc.submitted_at ASC NULLS LAST LIMIT 300`,
    [status],
  );
  return rows.map((r) => ({
    ...checkDto(r),
    workerId: r.worker_id,
    workerName: r.full_name,
    category: r.category_slug,
    locality: `${r.locality}, ${r.city}`,
    workerNote: r.worker_note,
    reference: r.reference_details,
    reviewerNotes: r.reviewer_notes,
    requiredForCategory: verificationPolicy(r.category_slug).required.some((x) => x.type === r.check_type && x.slot === r.slot),
    validMonths: verificationPolicy(r.category_slug).required.find((x) => x.type === r.check_type && x.slot === r.slot)?.validMonths ?? null,
  }));
}

export const decideSchema = z.object({
  outcome: z.enum(['passed', 'failed']),
  method: z.enum(REVIEW_METHODS),
  notes: z.string().trim().min(5).max(1000),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export async function adminDecideCheck(db: Db, actor: Actor, checkId: string, input: z.infer<typeof decideSchema>) {
  if (actor.role !== 'admin') throw forbidden();
  if (!uuid.safeParse(checkId).success) throw notFound();
  await db.transaction(async (tx) => {
    const { rows } = await tx.query(
      `SELECT vc.*, wp.category_slug, wp.user_id FROM verification_checks vc JOIN worker_profiles wp ON wp.id = vc.worker_id
        WHERE vc.id = $1 FOR UPDATE OF vc`,
      [checkId],
    );
    const c = rows[0];
    if (!c) throw notFound();
    if (c.status !== 'pending') throw conflict('check_not_pending');
    // Consent must have been given by the worker before any check is recorded.
    if (!c.consent_given_at) throw conflict('consent_missing');
    const rule = verificationPolicy(c.category_slug).required.find((r) => r.type === c.check_type && r.slot === c.slot);
    let expires: Date | null = null;
    if (input.outcome === 'passed' && rule?.validMonths) {
      if (!input.expiresAt) throw badRequest('validation_failed', { expiresAt: 'required' });
      expires = new Date(`${input.expiresAt}T23:59:59+05:30`);
      const max = new Date();
      max.setMonth(max.getMonth() + rule.validMonths);
      if (expires <= new Date() || expires > max) throw badRequest('validation_failed', { expiresAt: 'invalid' });
    } else if (input.expiresAt && input.outcome === 'passed') {
      expires = new Date(`${input.expiresAt}T23:59:59+05:30`);
      if (expires <= new Date()) throw badRequest('validation_failed', { expiresAt: 'invalid' });
    }
    // Referee contact details are deleted once the check is decided (data minimisation).
    await tx.query(
      `UPDATE verification_checks SET status = $2, method = $3, provider = 'manual_admin_review', reviewed_by = $4, reviewed_at = NOW(),
          expires_at = $5, reviewer_notes = $6, reference_details = NULL, updated_at = NOW() WHERE id = $1`,
      [checkId, input.outcome, input.method, actor.id, expires, input.notes],
    );
    await refreshVerificationSummary(tx, c.worker_id);
    await audit(tx, actor.id, `VERIFICATION_${input.outcome.toUpperCase()}`, 'worker', c.worker_id, `${c.check_type}#${c.slot} via ${input.method}: ${input.notes}`);
    await notify(tx, c.user_id, 'verification_decided', { type: c.check_type, outcome: input.outcome }, '/worker/verification');
  });
}
