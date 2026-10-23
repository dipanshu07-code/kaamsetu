import crypto from 'crypto';
import { z } from 'zod';
import { Queryable } from '../db';

export const uuid = z.string().uuid();

export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && uuid.safeParse(v).success;
}

/** Human-friendly reference numbers such as KS-2026-4F9A2C. */
export function referenceNumber(prefix: string) {
  return `${prefix}-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

/** Notification text is rendered client-side from `type` + `params` in the reader's language. */
export async function notify(
  q: Queryable,
  userId: string,
  type: string,
  params: Record<string, unknown> = {},
  link?: string,
) {
  await q.query('INSERT INTO notifications(user_id, type, params, link) VALUES ($1, $2, $3, $4)', [
    userId,
    type,
    JSON.stringify(params),
    link || null,
  ]);
}

export async function audit(
  q: Queryable,
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details: string,
) {
  await q.query(
    'INSERT INTO admin_audit_logs(admin_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)',
    [adminId, action, targetType, targetId, details.slice(0, 1000)],
  );
}

export async function addBookingHistory(q: Queryable, bookingId: string, status: string, userId: string | null, note?: string) {
  await q.query(
    'INSERT INTO booking_status_history(booking_id, status, note, created_by_user_id) VALUES ($1, $2, $3, $4)',
    [bookingId, status, note || null, userId],
  );
}

type ConversationContext =
  | { bookingId: string }
  | { requestMatchId: string }
  | { jobApplicationId: string };

/** Returns the conversation for a context, creating it with the given participants if needed. */
export async function ensureConversation(q: Queryable, ctx: ConversationContext, participantIds: string[]) {
  const col = 'bookingId' in ctx ? 'booking_id' : 'requestMatchId' in ctx ? 'request_match_id' : 'job_application_id';
  const val = Object.values(ctx)[0];
  let { rows } = await q.query(`SELECT id FROM conversations WHERE ${col} = $1`, [val]);
  if (!rows.length) {
    ({ rows } = await q.query(
      `INSERT INTO conversations(${col}) VALUES ($1)
       ON CONFLICT (${col}) DO UPDATE SET ${col} = EXCLUDED.${col} RETURNING id`,
      [val],
    ));
  }
  const id: string = rows[0].id;
  for (const uid of participantIds) {
    await q.query(
      'INSERT INTO conversation_participants(conversation_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, uid],
    );
  }
  return id;
}

/** System event in a conversation, e.g. "Price proposed". `key` is translated on the client. */
export async function systemMessage(
  q: Queryable,
  conversationId: string,
  key: string,
  params: Record<string, unknown> = {},
  opts: { kind?: 'system' | 'offer'; senderId?: string | null; offerId?: string } = {},
) {
  await q.query(
    `INSERT INTO messages(conversation_id, sender_id, kind, body, params, offer_id) VALUES ($1, $2, $3, $4, $5, $6)`,
    [conversationId, opts.senderId ?? null, opts.kind || 'system', key, JSON.stringify(params), opts.offerId || null],
  );
  await q.query('UPDATE conversations SET last_message_at = NOW() WHERE id = $1', [conversationId]);
}

export async function isBlockedEitherWay(q: Queryable, a: string, b: string) {
  const { rows } = await q.query(
    `SELECT 1 FROM user_blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
    [a, b],
  );
  return rows.length > 0;
}

export const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : null);
export const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

/** Indian mobile numbers: strip +91/0 prefixes and spaces; must be 10 digits starting 6-9. */
export const phoneSchema = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, ''))
  .refine((v) => /^[6-9]\d{9}$/.test(v), { message: 'invalid_phone' });
