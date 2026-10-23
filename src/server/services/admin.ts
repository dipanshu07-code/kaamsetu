import { z } from 'zod';
import { Db } from '../db';
import { Actor } from '../auth';
import { forbidden, notFound } from '../errors';
import { audit, iso, num, uuid } from './common';

function requireAdmin(actor: Actor) {
  if (actor.role !== 'admin') throw forbidden();
}

export async function adminOverview(db: Db, actor: Actor) {
  requireAdmin(actor);
  const { rows } = await db.query(`
    SELECT
      (SELECT COUNT(*)::int FROM worker_profiles) AS workers,
      (SELECT COUNT(*)::int FROM users WHERE role = 'customer' AND deleted_at IS NULL) AS customers,
      (SELECT COUNT(*)::int FROM users WHERE role = 'employer' AND deleted_at IS NULL) AS employers,
      (SELECT COUNT(*)::int FROM bookings) AS bookings,
      (SELECT COUNT(*)::int FROM bookings WHERE status = 'completed') AS completed,
      (SELECT COUNT(*)::int FROM bookings WHERE status = 'cancelled') AS cancelled,
      (SELECT COUNT(*)::int FROM service_requests WHERE status = 'open') AS open_requests,
      (SELECT COUNT(*)::int FROM job_listings WHERE status = 'open') AS open_jobs,
      (SELECT COUNT(*)::int FROM job_applications) AS applications,
      (SELECT COUNT(*)::int FROM complaints WHERE status IN ('open', 'under_investigation')) AS open_complaints,
      (SELECT COUNT(*)::int FROM verification_checks WHERE status = 'pending') AS pending_checks,
      (SELECT COUNT(*)::int FROM abuse_reports WHERE status IN ('open', 'reviewing')) AS open_reports,
      (SELECT COUNT(*)::int FROM worker_profiles WHERE safeguarding_hold) AS safeguarding_holds`);
  return rows[0];
}

export async function adminListBookings(db: Db, actor: Actor) {
  requireAdmin(actor);
  const { rows } = await db.query(
    `SELECT b.id, b.booking_number, b.status, b.service_title, b.starts_at, b.ends_at, b.agreed_price, b.terms_agreed_at,
            b.address_locality, b.address_city, wp.full_name AS worker_name, cu.full_name AS customer_name
       FROM bookings b JOIN worker_profiles wp ON wp.id = b.worker_id JOIN users cu ON cu.id = b.customer_id
      ORDER BY b.created_at DESC LIMIT 200`,
  );
  return rows.map((b) => ({
    id: b.id,
    bookingNumber: b.booking_number,
    status: b.status,
    serviceTitle: b.service_title,
    startsAt: iso(b.starts_at),
    endsAt: iso(b.ends_at),
    agreedPrice: b.terms_agreed_at ? num(b.agreed_price) : null,
    locality: `${b.address_locality}, ${b.address_city}`,
    workerName: b.worker_name,
    customerName: b.customer_name,
  }));
}

export async function adminListReports(db: Db, actor: Actor) {
  requireAdmin(actor);
  const { rows } = await db.query(
    `SELECT r.id, r.reason, r.status, r.created_at, ru.full_name AS reporter_name, tu.full_name AS reported_name
       FROM abuse_reports r JOIN users ru ON ru.id = r.reporter_id JOIN users tu ON tu.id = r.reported_user_id
      ORDER BY (r.status IN ('open', 'reviewing')) DESC, r.created_at DESC LIMIT 200`,
  );
  return rows.map((r) => ({ id: r.id, reason: r.reason, status: r.status, createdAt: iso(r.created_at), reporterName: r.reporter_name, reportedName: r.reported_name }));
}

export const reportUpdateSchema = z.object({
  status: z.enum(['reviewing', 'actioned', 'dismissed']),
  notes: z.string().trim().min(3).max(2000),
  suspendUser: z.boolean().optional(),
});

export async function adminUpdateReport(db: Db, actor: Actor, id: string, input: z.infer<typeof reportUpdateSchema>) {
  requireAdmin(actor);
  if (!uuid.safeParse(id).success) throw notFound();
  await db.transaction(async (tx) => {
    const { rows } = await tx.query('SELECT * FROM abuse_reports WHERE id = $1 FOR UPDATE', [id]);
    const r = rows[0];
    if (!r) throw notFound();
    await tx.query(`UPDATE abuse_reports SET status = $2, admin_notes = $3, resolved_at = $4 WHERE id = $1`, [
      id,
      input.status,
      input.notes,
      input.status === 'reviewing' ? null : new Date(),
    ]);
    if (input.suspendUser) await setSuspendedTx(tx, actor, r.reported_user_id, true, `abuse report ${id}`);
    await audit(tx, actor.id, `ABUSE_REPORT_${input.status.toUpperCase()}`, 'user', r.reported_user_id, input.notes);
  });
}

async function setSuspendedTx(tx: any, actor: Actor, userId: string, suspended: boolean, reason: string) {
  const { rows } = await tx.query('SELECT role FROM users WHERE id = $1', [userId]);
  if (!rows[0]) throw notFound();
  if (rows[0].role === 'admin') throw forbidden('cannot_suspend_admin');
  await tx.query('UPDATE users SET is_suspended = $2 WHERE id = $1', [userId, suspended]);
  if (suspended) await tx.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
  await audit(tx, actor.id, suspended ? 'USER_SUSPENDED' : 'USER_REINSTATED', 'user', userId, reason);
}

export async function adminSetSuspended(db: Db, actor: Actor, userId: string, suspended: boolean, reason: string) {
  requireAdmin(actor);
  if (!uuid.safeParse(userId).success) throw notFound();
  z.string().trim().min(3).max(500).parse(reason);
  await db.transaction((tx) => setSuspendedTx(tx, actor, userId, suspended, reason));
}

export const categoryToggleSchema = z.object({
  enabled: z.boolean(),
  reason: z.string().trim().max(300).optional(),
});

export async function adminToggleCategory(db: Db, actor: Actor, slug: string, input: z.infer<typeof categoryToggleSchema>) {
  requireAdmin(actor);
  await db.transaction(async (tx) => {
    const { rows } = await tx.query(
      'UPDATE service_categories SET is_enabled = $2, disabled_reason = $3, updated_at = NOW() WHERE slug = $1 RETURNING slug',
      [slug, input.enabled, input.enabled ? null : input.reason || 'Paused by platform administrator'],
    );
    if (!rows[0]) throw notFound();
    await audit(tx, actor.id, input.enabled ? 'CATEGORY_ENABLED' : 'CATEGORY_DISABLED', 'category', slug, input.reason || '');
  });
}

export async function adminAuditLog(db: Db, actor: Actor) {
  requireAdmin(actor);
  const { rows } = await db.query(
    `SELECT l.id, l.action, l.target_type, l.target_id, l.details, l.created_at, u.full_name AS admin_name
       FROM admin_audit_logs l JOIN users u ON u.id = l.admin_id ORDER BY l.created_at DESC LIMIT 300`,
  );
  return rows.map((l) => ({ id: l.id, action: l.action, targetType: l.target_type, targetId: l.target_id, details: l.details, adminName: l.admin_name, at: iso(l.created_at) }));
}

export async function adminListUsers(db: Db, actor: Actor, q?: string | null) {
  requireAdmin(actor);
  const like = q ? `%${q.replace(/[%_\\]/g, (m) => '\\' + m)}%` : null;
  const { rows } = await db.query(
    `SELECT u.id, u.full_name, u.role, u.city, u.locality, u.is_suspended, u.created_at, wp.id AS worker_id, wp.safeguarding_hold
       FROM users u LEFT JOIN worker_profiles wp ON wp.user_id = u.id
      WHERE u.deleted_at IS NULL AND ($1::text IS NULL OR u.full_name ILIKE $1 OR u.phone ILIKE $1)
      ORDER BY u.created_at DESC LIMIT 200`,
    [like],
  );
  return rows.map((u) => ({
    id: u.id,
    name: u.full_name,
    role: u.role,
    locality: [u.locality, u.city].filter(Boolean).join(', '),
    suspended: u.is_suspended,
    workerId: u.worker_id,
    safeguardingHold: !!u.safeguarding_hold,
    joinedAt: iso(u.created_at),
  }));
}

/**
 * Admin-assisted password reset (no SMS provider is configured).
 * Returns a one-time temporary password for the admin to share with the user
 * after confirming their identity by phone. All sessions are revoked.
 */
export async function adminResetPassword(db: Db, actor: Actor, userId: string, reason: string) {
  requireAdmin(actor);
  if (!uuid.safeParse(userId).success) throw notFound();
  z.string().trim().min(3).max(500).parse(reason);
  const { hashPassword } = await import('../auth');
  const crypto = await import('crypto');
  const temp = crypto.randomBytes(9).toString('base64url').slice(0, 12);
  await db.transaction(async (tx) => {
    const { rows } = await tx.query('SELECT role FROM users WHERE id = $1 AND deleted_at IS NULL', [userId]);
    if (!rows[0]) throw notFound();
    if (rows[0].role === 'admin') throw forbidden('cannot_suspend_admin');
    await tx.query('UPDATE users SET password_hash = $2 WHERE id = $1', [userId, hashPassword(temp)]);
    await tx.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
    await audit(tx, actor.id, 'PASSWORD_RESET', 'user', userId, reason);
  });
  return { temporaryPassword: temp };
}
