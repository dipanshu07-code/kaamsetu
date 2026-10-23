import { z } from 'zod';
import { Db, Queryable } from '../db';
import { Actor } from '../auth';
import { forbidden, notFound } from '../errors';
import { audit, iso, notify, referenceNumber, uuid } from './common';

export const complaintSchema = z.object({
  bookingId: uuid.optional().nullable(),
  category: z.enum(['unprofessional_behavior', 'billing_dispute', 'no_show', 'poor_work_quality', 'safety_concern', 'other']),
  subject: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(2000),
});

export async function createComplaintTx(q: Queryable, actor: Actor, input: z.infer<typeof complaintSchema>) {
  let accusedUserId: string | null = null;
  let accusedWorkerId: string | null = null;
  if (input.bookingId) {
    const { rows } = await q.query(
      `SELECT b.customer_id, b.worker_id, wp.user_id AS worker_user_id FROM bookings b JOIN worker_profiles wp ON wp.id = b.worker_id WHERE b.id = $1`,
      [input.bookingId],
    );
    const b = rows[0];
    if (!b || (b.customer_id !== actor.id && b.worker_user_id !== actor.id)) throw notFound();
    if (b.customer_id === actor.id) {
      accusedUserId = b.worker_user_id;
      accusedWorkerId = b.worker_id;
    } else accusedUserId = b.customer_id;
  }
  const ticket = referenceNumber('TKT');
  const { rows } = await q.query(
    `INSERT INTO complaints(ticket_number, booking_id, raised_by_user_id, accused_user_id, accused_worker_id, category, subject, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [ticket, input.bookingId || null, actor.id, accusedUserId, accusedWorkerId, input.category, input.subject, input.description],
  );
  // Safety escalation: a safety concern immediately pauses the worker for any
  // category with mandatory safeguarding checks (e.g. childcare) until an admin reviews it.
  if (input.category === 'safety_concern' && accusedWorkerId) {
    await q.query('UPDATE worker_profiles SET safeguarding_hold = TRUE WHERE id = $1', [accusedWorkerId]);
  }
  await notify(q, actor.id, 'complaint_received', { ticket }, '/grievance');
  return { id: rows[0].id as string, ticketNumber: ticket };
}

export async function createComplaint(db: Db, actor: Actor, input: z.infer<typeof complaintSchema>) {
  return db.transaction((tx) => createComplaintTx(tx, actor, input));
}

function complaintDto(r: any) {
  return {
    id: r.id,
    ticketNumber: r.ticket_number,
    bookingId: r.booking_id,
    category: r.category,
    subject: r.subject,
    description: r.description,
    status: r.status,
    resolutionNotes: r.resolution_notes,
    createdAt: iso(r.created_at),
    resolvedAt: iso(r.resolved_at),
  };
}

export async function listMyComplaints(db: Db, actor: Actor) {
  const { rows } = await db.query('SELECT * FROM complaints WHERE raised_by_user_id = $1 ORDER BY created_at DESC', [actor.id]);
  return rows.map(complaintDto);
}

export async function adminListComplaints(db: Db, actor: Actor) {
  if (actor.role !== 'admin') throw forbidden();
  const { rows } = await db.query(
    `SELECT c.*, ru.full_name AS raised_by_name, ru.role AS raised_by_role, au.full_name AS accused_name,
            wp.safeguarding_hold, wp.id AS accused_worker
       FROM complaints c JOIN users ru ON ru.id = c.raised_by_user_id
       LEFT JOIN users au ON au.id = c.accused_user_id
       LEFT JOIN worker_profiles wp ON wp.id = c.accused_worker_id
      ORDER BY (c.status IN ('open', 'under_investigation')) DESC, c.created_at DESC LIMIT 300`,
  );
  return rows.map((r) => ({
    ...complaintDto(r),
    raisedByName: r.raised_by_name,
    raisedByRole: r.raised_by_role,
    accusedName: r.accused_name,
    accusedWorkerId: r.accused_worker,
    safeguardingHold: !!r.safeguarding_hold,
  }));
}

export const complaintUpdateSchema = z.object({
  status: z.enum(['under_investigation', 'resolved', 'dismissed']),
  notes: z.string().trim().min(5).max(2000),
  liftSafeguardingHold: z.boolean().optional(),
});

export async function adminUpdateComplaint(db: Db, actor: Actor, id: string, input: z.infer<typeof complaintUpdateSchema>) {
  if (actor.role !== 'admin') throw forbidden();
  if (!uuid.safeParse(id).success) throw notFound();
  await db.transaction(async (tx) => {
    const { rows } = await tx.query('SELECT * FROM complaints WHERE id = $1 FOR UPDATE', [id]);
    const c = rows[0];
    if (!c) throw notFound();
    const done = input.status !== 'under_investigation';
    await tx.query(
      `UPDATE complaints SET status = $2, resolution_notes = $3, resolved_by_admin_id = $4, resolved_at = $5 WHERE id = $1`,
      [id, input.status, input.notes, actor.id, done ? new Date() : null],
    );
    if (input.liftSafeguardingHold && c.accused_worker_id) {
      await tx.query('UPDATE worker_profiles SET safeguarding_hold = FALSE WHERE id = $1', [c.accused_worker_id]);
      await audit(tx, actor.id, 'SAFEGUARDING_HOLD_LIFTED', 'worker', c.accused_worker_id, `complaint ${c.ticket_number}`);
    }
    await audit(tx, actor.id, `COMPLAINT_${input.status.toUpperCase()}`, 'complaint', id, input.notes);
    await notify(tx, c.raised_by_user_id, 'complaint_updated', { ticket: c.ticket_number, status: input.status }, '/grievance');
  });
}

// ---------- Notifications ----------
export async function listNotifications(db: Db, actor: Actor) {
  const { rows } = await db.query(
    'SELECT id, type, params, link, read_at, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
    [actor.id],
  );
  return rows.map((n) => ({ id: n.id, type: n.type, params: n.params, link: n.link, read: !!n.read_at, createdAt: iso(n.created_at) }));
}

export async function markNotificationsRead(db: Db, actor: Actor, ids?: string[]) {
  if (ids?.length) {
    await db.query('UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND id = ANY($2::uuid[]) AND read_at IS NULL', [
      actor.id,
      ids.filter((i) => uuid.safeParse(i).success),
    ]);
  } else {
    await db.query('UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL', [actor.id]);
  }
}
