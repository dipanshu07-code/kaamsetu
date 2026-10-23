import { z } from 'zod';
import { Db, Queryable } from '../db';
import { Actor } from '../auth';
import { conflict, forbidden, isUniqueViolation, notFound } from '../errors';
import { audit, isBlockedEitherWay, iso, notify, uuid } from './common';

/** Loads a conversation the actor participates in. Non-participants get 404. */
async function loadConversation(q: Queryable, actor: Actor, id: string) {
  if (!uuid.safeParse(id).success) throw notFound();
  const { rows } = await q.query(
    `SELECT c.*, other.user_id AS other_user_id, ou.full_name AS other_name, ou.role AS other_role, cp.last_read_at
       FROM conversations c
       JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $2
       LEFT JOIN conversation_participants other ON other.conversation_id = c.id AND other.user_id <> $2
       LEFT JOIN users ou ON ou.id = other.user_id
      WHERE c.id = $1`,
    [id, actor.id],
  );
  if (!rows[0]) throw notFound();
  return rows[0];
}

async function contextOf(q: Queryable, c: any) {
  if (c.booking_id) {
    const { rows } = await q.query('SELECT service_title, service_category_slug, service_request_id, status, booking_number FROM bookings WHERE id = $1', [c.booking_id]);
    const b = rows[0];
    // Request-based bookings are titled by category so the client can translate it.
    return b?.service_request_id
      ? { type: 'booking' as const, id: c.booking_id, title: b.service_category_slug, titleIsCategory: true, status: b.status, ref: b.booking_number }
      : { type: 'booking' as const, id: c.booking_id, title: b?.service_title, titleIsCategory: false, status: b?.status, ref: b?.booking_number };
  }
  if (c.request_match_id) {
    const { rows } = await q.query(
      `SELECT sr.id, sr.category_slug, sr.status, sr.request_number FROM service_request_workers m
         JOIN service_requests sr ON sr.id = m.request_id WHERE m.id = $1`,
      [c.request_match_id],
    );
    return { type: 'request' as const, id: rows[0]?.id, title: rows[0]?.category_slug, titleIsCategory: true, status: rows[0]?.status, ref: rows[0]?.request_number };
  }
  const { rows } = await q.query(
    `SELECT a.id, a.status, j.title, j.id AS job_id FROM job_applications a JOIN job_listings j ON j.id = a.job_id WHERE a.id = $1`,
    [c.job_application_id],
  );
  return { type: 'application' as const, id: rows[0]?.id, title: rows[0]?.title, titleIsCategory: false, status: rows[0]?.status, ref: rows[0]?.job_id };
}

function firstName(name: string | null) {
  return (name || '').split(' ')[0] || null;
}

export async function listConversations(db: Db, actor: Actor) {
  const { rows } = await db.query(
    `SELECT c.*, ou.full_name AS other_name, ou.role AS other_role, cp.last_read_at,
            lm.body AS last_body, lm.kind AS last_kind, lm.params AS last_params, lm.sender_id AS last_sender, lm.created_at AS last_at
       FROM conversation_participants cp
       JOIN conversations c ON c.id = cp.conversation_id
       LEFT JOIN conversation_participants other ON other.conversation_id = c.id AND other.user_id <> cp.user_id
       LEFT JOIN users ou ON ou.id = other.user_id
       LEFT JOIN LATERAL (SELECT body, kind, params, sender_id, created_at FROM messages m
                           WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) lm ON TRUE
      WHERE cp.user_id = $1
      ORDER BY c.last_message_at DESC LIMIT 100`,
    [actor.id],
  );
  const out = [];
  for (const c of rows) {
    out.push({
      id: c.id,
      otherName: c.other_name,
      otherRole: c.other_role,
      context: await contextOf(db, c),
      lastMessage: c.last_at
        ? { kind: c.last_kind, body: c.last_body, params: c.last_params, mine: c.last_sender === actor.id, at: iso(c.last_at) }
        : null,
      unread: !!c.last_at && c.last_sender !== actor.id && (!c.last_read_at || new Date(c.last_at) > new Date(c.last_read_at)),
    });
  }
  return out;
}

function messageDto(m: any, actorId: string) {
  return {
    id: m.id,
    mine: m.sender_id === actorId,
    senderName: m.sender_id ? firstName(m.sender_name) : null,
    kind: m.kind,
    body: m.body,
    params: m.params,
    offerId: m.offer_id,
    createdAt: iso(m.created_at),
  };
}

export async function getConversation(db: Db, actor: Actor, id: string, after?: string | null) {
  const c = await loadConversation(db, actor, id);
  const afterDate = after && !isNaN(Date.parse(after)) ? new Date(after) : null;
  const { rows } = await db.query(
    `SELECT * FROM (
       SELECT m.*, u.full_name AS sender_name FROM messages m LEFT JOIN users u ON u.id = m.sender_id
        WHERE m.conversation_id = $1 AND ($2::timestamptz IS NULL OR m.created_at > $2)
        ORDER BY m.created_at DESC LIMIT 200) t ORDER BY created_at ASC`,
    [id, afterDate],
  );
  await db.query('UPDATE conversation_participants SET last_read_at = NOW() WHERE conversation_id = $1 AND user_id = $2', [id, actor.id]);
  await db.query(
    `UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND type = 'new_message' AND read_at IS NULL AND params->>'conversationId' = $2`,
    [actor.id, id],
  );
  const blocks = await db.query(
    'SELECT blocker_id FROM user_blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)',
    [actor.id, c.other_user_id],
  );
  return {
    id: c.id,
    otherName: c.other_name,
    otherRole: c.other_role,
    context: await contextOf(db, c),
    iBlocked: blocks.rows.some((b) => b.blocker_id === actor.id),
    blockedMe: blocks.rows.some((b) => b.blocker_id !== actor.id),
    messages: rows.map((m) => messageDto(m, actor.id)),
  };
}

export const sendSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  clientId: z.string().min(6).max(64).optional(),
});

export async function sendMessage(db: Db, actor: Actor, id: string, input: z.infer<typeof sendSchema>) {
  return db.transaction(async (tx) => {
    const c = await loadConversation(tx, actor, id);
    if (c.other_user_id && (await isBlockedEitherWay(tx, actor.id, c.other_user_id))) throw forbidden('blocked');
    let row;
    try {
      // A savepoint keeps the transaction usable if the idempotency key repeats.
      await tx.query('SAVEPOINT send_msg');
      ({ rows: [row] } = await tx.query(
        `INSERT INTO messages(conversation_id, sender_id, kind, body, client_id) VALUES ($1, $2, 'text', $3, $4) RETURNING *`,
        [id, actor.id, input.body, input.clientId || null],
      ));
      await tx.query('RELEASE SAVEPOINT send_msg');
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
      await tx.query('ROLLBACK TO SAVEPOINT send_msg');
      ({ rows: [row] } = await tx.query('SELECT * FROM messages WHERE conversation_id = $1 AND sender_id = $2 AND client_id = $3', [
        id,
        actor.id,
        input.clientId,
      ]));
      return messageDto({ ...row, sender_name: actor.name }, actor.id);
    }
    await tx.query('UPDATE conversations SET last_message_at = NOW() WHERE id = $1', [id]);
    await tx.query('UPDATE conversation_participants SET last_read_at = NOW() WHERE conversation_id = $1 AND user_id = $2', [id, actor.id]);
    if (c.other_user_id) {
      const pending = await tx.query(
        `SELECT 1 FROM notifications WHERE user_id = $1 AND type = 'new_message' AND read_at IS NULL AND params->>'conversationId' = $2`,
        [c.other_user_id, id],
      );
      if (!pending.rows.length) {
        await notify(tx, c.other_user_id, 'new_message', { conversationId: id, from: firstName(actor.name) }, `/messages/${id}`);
      }
    }
    return messageDto({ ...row, sender_name: actor.name }, actor.id);
  });
}

export async function setBlock(db: Db, actor: Actor, conversationId: string, block: boolean) {
  const c = await loadConversation(db, actor, conversationId);
  if (!c.other_user_id) throw notFound();
  if (block) {
    await db.query('INSERT INTO user_blocks(blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [actor.id, c.other_user_id]);
  } else {
    await db.query('DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2', [actor.id, c.other_user_id]);
  }
}

export const reportSchema = z.object({
  reason: z.enum(['harassment', 'threat', 'fraud', 'inappropriate', 'spam', 'other']),
  details: z.string().trim().max(1000).optional(),
  messageId: uuid.optional(),
  alsoBlock: z.boolean().optional(),
});

export async function reportConversation(db: Db, actor: Actor, conversationId: string, input: z.infer<typeof reportSchema>) {
  return db.transaction(async (tx) => {
    const c = await loadConversation(tx, actor, conversationId);
    if (!c.other_user_id) throw notFound();
    if (input.messageId) {
      const { rows } = await tx.query('SELECT sender_id FROM messages WHERE id = $1 AND conversation_id = $2', [input.messageId, conversationId]);
      if (!rows[0] || rows[0].sender_id !== c.other_user_id) throw notFound();
    }
    const open = await tx.query(
      `SELECT 1 FROM abuse_reports WHERE reporter_id = $1 AND conversation_id = $2 AND status IN ('open', 'reviewing')`,
      [actor.id, conversationId],
    );
    if (open.rows.length) throw conflict('already_reported');
    const { rows } = await tx.query(
      `INSERT INTO abuse_reports(reporter_id, reported_user_id, conversation_id, message_id, reason, details)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [actor.id, c.other_user_id, conversationId, input.messageId || null, input.reason, input.details || null],
    );
    if (input.alsoBlock) {
      await tx.query('INSERT INTO user_blocks(blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [actor.id, c.other_user_id]);
    }
    return { id: rows[0].id };
  });
}

/** Admin access to a conversation is allowed only through an abuse report, and is audit-logged. */
export async function adminViewReport(db: Db, admin: Actor, reportId: string) {
  if (admin.role !== 'admin') throw forbidden();
  if (!uuid.safeParse(reportId).success) throw notFound();
  const { rows } = await db.query(
    `SELECT r.*, ru.full_name AS reporter_name, tu.full_name AS reported_name, tu.role AS reported_role, tu.is_suspended
       FROM abuse_reports r JOIN users ru ON ru.id = r.reporter_id JOIN users tu ON tu.id = r.reported_user_id WHERE r.id = $1`,
    [reportId],
  );
  const r = rows[0];
  if (!r) throw notFound();
  let messages: any[] = [];
  if (r.conversation_id) {
    messages = (
      await db.query(
        `SELECT m.*, u.full_name AS sender_name FROM messages m LEFT JOIN users u ON u.id = m.sender_id
          WHERE m.conversation_id = $1 ORDER BY m.created_at DESC LIMIT 100`,
        [r.conversation_id],
      )
    ).rows.reverse();
    await audit(db, admin.id, 'REPORTED_CONVERSATION_VIEWED', 'user', r.reported_user_id, `report ${r.id}`);
  }
  return {
    id: r.id,
    reason: r.reason,
    details: r.details,
    status: r.status,
    adminNotes: r.admin_notes,
    createdAt: iso(r.created_at),
    reporterName: r.reporter_name,
    reportedUserId: r.reported_user_id,
    reportedName: r.reported_name,
    reportedRole: r.reported_role,
    reportedSuspended: r.is_suspended,
    reportedMessageId: r.message_id,
    messages: messages.map((m) => ({
      ...messageDto(m, ''),
      senderName: m.sender_name,
      isReported: m.id === r.message_id,
    })),
  };
}
