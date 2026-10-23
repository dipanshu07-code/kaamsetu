import { z } from 'zod';
import { Db, Queryable } from '../db';
import { Actor, createSession, hashPassword, verifyPassword } from '../auth';
import { badRequest, conflict, forbidden, isUniqueViolation, ApiError } from '../errors';
import { notify, phoneSchema, uuid } from './common';

const name = z.string().trim().min(2).max(150);

export const signupSchema = z
  .object({
    role: z.enum(['customer', 'worker', 'employer']),
    fullName: name,
    phone: phoneSchema,
    password: z.string().min(8).max(100),
    city: z.string().trim().min(2).max(100),
    localityId: uuid.optional().nullable(),
    localityText: z.string().trim().max(150).optional(),
    language: z.enum(['en', 'hi']).default('en'),
    acceptPrivacy: z.literal(true),
    // employer
    organisationName: z.string().trim().min(2).max(150).optional(),
    // worker
    categorySlug: z.string().max(50).optional(),
    experienceYears: z.number().int().min(0).max(60).optional(),
    skills: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
    languages: z.array(z.string().trim().min(1).max(40)).max(8).optional(),
    acceptsOnDemand: z.boolean().optional(),
    openToJobs: z.boolean().optional(),
    assistedBy: z.string().trim().max(150).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.role === 'worker' && !v.categorySlug) ctx.addIssue({ code: 'custom', path: ['categorySlug'], message: 'required' });
    if (v.role === 'employer' && !v.organisationName)
      ctx.addIssue({ code: 'custom', path: ['organisationName'], message: 'required' });
    if (!v.localityId && !v.localityText) ctx.addIssue({ code: 'custom', path: ['localityId'], message: 'required' });
  });

async function resolveLocality(q: Queryable, localityId: string | null | undefined, text: string | undefined, city: string) {
  if (localityId) {
    const { rows } = await q.query('SELECT id, name, city FROM localities WHERE id = $1', [localityId]);
    if (!rows[0]) throw badRequest('validation_failed', { localityId: 'invalid' });
    return { id: rows[0].id as string, name: rows[0].name as string, city: rows[0].city as string };
  }
  return { id: null, name: (text || '').trim(), city };
}

export async function signup(db: Db, input: z.infer<typeof signupSchema>) {
  try {
    return await db.transaction(async (tx) => {
      const loc = await resolveLocality(tx, input.localityId, input.localityText, input.city);
      const { rows } = await tx.query(
        `INSERT INTO users(phone, full_name, role, locality, city, locality_id, password_hash, preferred_language, privacy_accepted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING id`,
        [input.phone, input.fullName, input.role, loc.name, loc.city, loc.id, hashPassword(input.password), input.language],
      );
      const userId: string = rows[0].id;

      if (input.role === 'worker') {
        const cat = await tx.query('SELECT slug FROM service_categories WHERE slug = $1', [input.categorySlug]);
        if (!cat.rows[0]) throw badRequest('validation_failed', { categorySlug: 'invalid' });
        await tx.query(
          `INSERT INTO worker_profiles(user_id, full_name, phone, category_slug, experience_years, city, locality, locality_id,
              skills, languages, accepts_on_demand, open_to_jobs, profile_assisted_by, rating, verification_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0, 'unverified')`,
          [
            userId,
            input.fullName,
            input.phone,
            input.categorySlug,
            input.experienceYears ?? 0,
            loc.city,
            loc.name,
            loc.id,
            input.skills || [],
            input.languages?.length ? input.languages : ['Hindi'],
            input.acceptsOnDemand ?? true,
            input.openToJobs ?? false,
            input.assistedBy || null,
          ],
        );
      }
      if (input.role === 'employer') {
        await tx.query('INSERT INTO business_accounts(business_name, contact_person_id) VALUES ($1, $2)', [
          input.organisationName,
          userId,
        ]);
      }
      await notify(tx, userId, 'welcome', { role: input.role });
      const session = await createSession(tx, userId);
      return { userId, session };
    });
  } catch (e) {
    if (isUniqueViolation(e)) throw conflict('phone_taken');
    throw e;
  }
}

export const loginSchema = z.object({ phone: phoneSchema, password: z.string().min(1).max(100) });

export async function login(db: Db, input: z.infer<typeof loginSchema>) {
  const { rows } = await db.query(
    `SELECT id, password_hash, is_suspended, deleted_at, is_active FROM users WHERE phone = $1`,
    [input.phone],
  );
  const u = rows[0];
  // Same response for unknown phone and wrong password.
  if (!u || u.deleted_at || !u.is_active || !verifyPassword(input.password, u.password_hash)) {
    throw new ApiError(401, 'invalid_credentials');
  }
  if (u.is_suspended) throw forbidden('account_suspended');
  return createSession(db, u.id);
}

export async function getMe(db: Db, actor: Actor) {
  const { rows } = await db.query(
    `SELECT u.id, u.full_name, u.phone, u.email, u.role, u.locality, u.city, u.locality_id, u.preferred_language,
            u.created_at, ba.business_name,
            (SELECT COUNT(*)::int FROM notifications n WHERE n.user_id = u.id AND n.read_at IS NULL) AS unread_notifications,
            (SELECT COUNT(*)::int FROM conversation_participants cp JOIN conversations c ON c.id = cp.conversation_id
              WHERE cp.user_id = u.id AND c.last_message_at > COALESCE(cp.last_read_at, 'epoch')
                AND EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.id
                             AND (m.sender_id IS NULL OR m.sender_id <> u.id)
                             AND m.created_at > COALESCE(cp.last_read_at, 'epoch'))) AS unread_conversations
       FROM users u
       LEFT JOIN business_accounts ba ON ba.contact_person_id = u.id
      WHERE u.id = $1`,
    [actor.id],
  );
  const u = rows[0];
  return {
    id: u.id,
    name: u.full_name,
    phone: u.phone,
    role: u.role,
    locality: u.locality,
    city: u.city,
    localityId: u.locality_id,
    language: u.preferred_language,
    organisationName: u.business_name || null,
    workerProfileId: actor.workerId,
    unreadNotifications: u.unread_notifications,
    unreadConversations: u.unread_conversations,
  };
}

export const updateMeSchema = z.object({
  fullName: name.optional(),
  language: z.enum(['en', 'hi']).optional(),
  city: z.string().trim().min(2).max(100).optional(),
  localityId: uuid.nullable().optional(),
  localityText: z.string().trim().max(150).optional(),
});

export async function updateMe(db: Db, actor: Actor, input: z.infer<typeof updateMeSchema>) {
  await db.transaction(async (tx) => {
    if (input.fullName) await tx.query('UPDATE users SET full_name = $2, updated_at = NOW() WHERE id = $1', [actor.id, input.fullName]);
    if (input.language) await tx.query('UPDATE users SET preferred_language = $2 WHERE id = $1', [actor.id, input.language]);
    if (input.localityId !== undefined || input.localityText) {
      const { rows } = await tx.query('SELECT city FROM users WHERE id = $1', [actor.id]);
      const loc = await resolveLocality(tx, input.localityId, input.localityText, input.city || rows[0].city);
      await tx.query('UPDATE users SET locality = $2, city = $3, locality_id = $4 WHERE id = $1', [
        actor.id,
        loc.name,
        loc.city,
        loc.id,
      ]);
    }
  });
}

export async function changePassword(db: Db, actor: Actor, current: string, next: string) {
  const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [actor.id]);
  if (!verifyPassword(current, rows[0]?.password_hash)) throw new ApiError(400, 'wrong_password');
  await db.transaction(async (tx) => {
    await tx.query('UPDATE users SET password_hash = $2 WHERE id = $1', [actor.id, hashPassword(next)]);
    await tx.query('DELETE FROM user_sessions WHERE user_id = $1', [actor.id]);
  });
}

/**
 * Account deletion: personal data is removed or anonymised immediately.
 * Booking and review records are kept (anonymised) for dispute handling and
 * accounting — see docs/PRIVACY_AND_SECURITY.md for the retention rules.
 */
export async function deleteAccount(db: Db, actor: Actor, password: string) {
  if (actor.role === 'admin') throw forbidden('admin_cannot_self_delete');
  const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [actor.id]);
  if (!verifyPassword(password, rows[0]?.password_hash)) throw new ApiError(400, 'wrong_password');

  await db.transaction(async (tx) => {
    const placeholderPhone = `del-${actor.id.replace(/-/g, '').slice(0, 11)}`;
    // Cancel upcoming bookings and tell the other party.
    const { rows: open } = await tx.query(
      `SELECT b.id, b.customer_id, wp.user_id AS worker_user_id FROM bookings b
         JOIN worker_profiles wp ON wp.id = b.worker_id
        WHERE (b.customer_id = $1 OR wp.user_id = $1) AND b.status IN ('pending', 'accepted', 'confirmed')`,
      [actor.id],
    );
    for (const b of open) {
      await tx.query(
        `UPDATE bookings SET status = 'cancelled', cancelled_by = $2, cancellation_reason = 'account_deleted', updated_at = NOW() WHERE id = $1`,
        [b.id, actor.role === 'worker' ? 'worker' : 'customer'],
      );
      const other = b.customer_id === actor.id ? b.worker_user_id : b.customer_id;
      await notify(tx, other, 'booking_cancelled', { reason: 'account_deleted' }, `/bookings/${b.id}`);
    }
    await tx.query(`UPDATE service_requests SET status = 'cancelled' WHERE customer_id = $1 AND status = 'open'`, [actor.id]);
    await tx.query(`UPDATE job_listings SET status = 'closed' WHERE employer_id = $1`, [actor.id]);
    await tx.query(`UPDATE job_applications SET status = 'withdrawn' WHERE applicant_user_id = $1 AND status NOT IN ('hired', 'rejected')`, [actor.id]);
    if (actor.workerId) {
      await tx.query(
        `UPDATE worker_profiles SET full_name = 'Deleted user', full_name_hi = NULL, phone = '', avatar_url = NULL,
            bio = NULL, bio_hi = NULL, headline = NULL, skills = '{}', accepts_on_demand = FALSE, open_to_jobs = FALSE,
            is_available_today = FALSE WHERE id = $1`,
        [actor.workerId],
      );
      await tx.query('UPDATE verification_checks SET reference_details = NULL WHERE worker_id = $1', [actor.workerId]);
      await tx.query('DELETE FROM worker_experience WHERE worker_id = $1', [actor.workerId]);
      await tx.query('DELETE FROM worker_time_off WHERE worker_id = $1', [actor.workerId]);
    }
    await tx.query('DELETE FROM saved_jobs WHERE user_id = $1', [actor.id]);
    await tx.query('DELETE FROM notifications WHERE user_id = $1', [actor.id]);
    await tx.query('DELETE FROM user_sessions WHERE user_id = $1', [actor.id]);
    await tx.query(
      `UPDATE users SET full_name = 'Deleted user', phone = $2, email = NULL, password_hash = NULL, locality = NULL,
          locality_id = NULL, is_active = FALSE, deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [actor.id, placeholderPhone],
    );
  });
}

/** Personal data export (copy of what we hold about the requesting user). */
export async function exportMyData(db: Db, actor: Actor) {
  const one = async (sql: string) => (await db.query(sql, [actor.id])).rows;
  return {
    exportedAt: new Date().toISOString(),
    account: (await one('SELECT id, full_name, phone, email, role, locality, city, preferred_language, created_at FROM users WHERE id = $1'))[0],
    workerProfile: (await one('SELECT * FROM worker_profiles WHERE user_id = $1'))[0] || null,
    bookingsAsCustomer: await one('SELECT * FROM bookings WHERE customer_id = $1'),
    serviceRequests: await one('SELECT id, request_number, category_slug, problem, locality_text, city, preferred_start, preferred_end, status, created_at FROM service_requests WHERE customer_id = $1'),
    jobApplications: await one('SELECT * FROM job_applications WHERE applicant_user_id = $1'),
    jobListings: await one('SELECT * FROM job_listings WHERE employer_id = $1'),
    messagesSent: await one('SELECT conversation_id, body, created_at FROM messages WHERE sender_id = $1'),
    complaints: await one('SELECT * FROM complaints WHERE raised_by_user_id = $1'),
  };
}

export async function listLocalities(db: Db, city?: string | null) {
  const { rows } = await db.query(
    `SELECT id, name, name_hi, city, (lat IS NOT NULL) AS has_coordinates FROM localities
      WHERE ($1::text IS NULL OR city = $1) ORDER BY city, name`,
    [city || null],
  );
  return rows.map((r) => ({ id: r.id, name: r.name, nameHi: r.name_hi, city: r.city, hasCoordinates: r.has_coordinates }));
}

export async function listCategories(db: Db, includeDisabled = false) {
  const { rows } = await db.query(
    `SELECT id, slug, name, name_hi, icon_name, description, description_hi, starting_price, price_unit, is_enabled, disabled_reason
       FROM service_categories WHERE ($1 OR is_enabled) ORDER BY created_at, name`,
    [includeDisabled],
  );
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    nameHi: r.name_hi,
    iconName: r.icon_name,
    description: r.description,
    descriptionHi: r.description_hi,
    startingPrice: Number(r.starting_price),
    priceUnit: r.price_unit,
    isEnabled: r.is_enabled,
    disabledReason: r.disabled_reason,
  }));
}
