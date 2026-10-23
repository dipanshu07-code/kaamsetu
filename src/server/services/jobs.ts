import { z } from 'zod';
import { Db } from '../db';
import { Actor } from '../auth';
import { badRequest, conflict, forbidden, isUniqueViolation, notFound } from '../errors';
import { APPLICATION_STATUSES, EMPLOYMENT_TYPES, PAY_PERIODS } from '@/lib/domain';
import { ensureConversation, iso, notify, num, systemMessage, uuid } from './common';

export const jobSchema = z
  .object({
    title: z.string().trim().min(3).max(150),
    duties: z.string().trim().min(10).max(4000),
    tradeSlug: z.string().max(50).nullable().optional(),
    localityId: uuid.nullable().optional(),
    localityText: z.string().trim().min(2).max(150).optional(),
    city: z.string().trim().min(2).max(100),
    requiredSkills: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
    employmentType: z.enum(EMPLOYMENT_TYPES),
    payMin: z.number().min(0).max(10_000_000).nullable().optional(),
    payMax: z.number().min(0).max(10_000_000).nullable().optional(),
    payPeriod: z.enum(PAY_PERIODS),
    schedule: z.string().trim().min(3).max(300),
    openings: z.number().int().min(1).max(500).default(1),
    applicationMethod: z.enum(['in_app', 'phone', 'email']).default('in_app'),
    contactValue: z.string().trim().max(150).optional(),
    closesOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.payMin != null && v.payMax != null && v.payMax < v.payMin)
      ctx.addIssue({ code: 'custom', path: ['payMax'], message: 'invalid' });
    if (v.applicationMethod === 'phone' && !/^[6-9]\d{9}$/.test((v.contactValue || '').replace(/\D/g, '').slice(-10)))
      ctx.addIssue({ code: 'custom', path: ['contactValue'], message: 'invalid_phone' });
    if (v.applicationMethod === 'email' && !z.string().email().safeParse(v.contactValue).success)
      ctx.addIssue({ code: 'custom', path: ['contactValue'], message: 'invalid' });
    if (!v.localityId && !v.localityText) ctx.addIssue({ code: 'custom', path: ['localityId'], message: 'required' });
  });

function jobDto(r: any, opts: { showContact: boolean }) {
  return {
    id: r.id,
    title: r.title,
    organisationName: r.organisation_name,
    duties: r.duties,
    trade: r.trade_slug,
    locality: r.locality_text,
    localityId: r.locality_id,
    city: r.city,
    requiredSkills: r.required_skills || [],
    employmentType: r.employment_type,
    payMin: num(r.pay_min),
    payMax: num(r.pay_max),
    payPeriod: r.pay_period,
    schedule: r.schedule,
    openings: r.openings,
    applicationMethod: r.application_method,
    contactValue: opts.showContact ? r.contact_value : null,
    status: r.status,
    isDemo: r.is_demo,
    closesOn: r.closes_on ? String(iso(r.closes_on)).slice(0, 10) : null,
    createdAt: iso(r.created_at),
    distanceKm: r.distance_km == null ? null : Math.round(r.distance_km * 10) / 10,
    saved: !!r.saved,
    myApplicationStatus: r.my_status || null,
    applicationCount: r.application_count ?? undefined,
  };
}

export const jobSearchSchema = z.object({
  q: z.string().max(100).optional(),
  trade: z.string().max(50).optional(),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
  city: z.string().max(100).optional(),
  localityId: uuid.optional(),
  maxKm: z.coerce.number().min(1).max(200).optional(),
  minPay: z.coerce.number().min(0).optional(),
  payPeriod: z.enum(PAY_PERIODS).optional(),
  savedOnly: z.coerce.boolean().optional(),
});

export async function searchJobs(db: Db, actor: Actor | null, f: z.infer<typeof jobSearchSchema>) {
  const params: unknown[] = [];
  const p = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };
  const me = p(actor?.id || null);
  const where = [`j.status = 'open'`, `(j.closes_on IS NULL OR j.closes_on >= CURRENT_DATE)`];
  let dist = 'NULL::float';
  if (f.localityId) {
    const { rows } = await db.query('SELECT city FROM localities WHERE id = $1', [f.localityId]);
    if (rows[0] && !f.city) f.city = rows[0].city;
    dist = `km_between(l.lat, l.lng, (SELECT lat FROM localities WHERE id = ${p(f.localityId)}), (SELECT lng FROM localities WHERE id = $${params.length}))`;
  }
  if (f.city) where.push(`j.city = ${p(f.city)}`);
  if (f.trade) where.push(`j.trade_slug = ${p(f.trade)}`);
  if (f.employmentType) where.push(`j.employment_type = ${p(f.employmentType)}`);
  if (f.payPeriod) where.push(`j.pay_period = ${p(f.payPeriod)}`);
  if (f.minPay) where.push(`COALESCE(j.pay_max, j.pay_min) >= ${p(f.minPay)}`);
  if (f.savedOnly) where.push(`s.job_id IS NOT NULL`);
  if (f.q) {
    const like = p(`%${f.q.replace(/[%_\\]/g, (m) => '\\' + m)}%`);
    where.push(`(j.title ILIKE ${like} OR j.duties ILIKE ${like} OR j.organisation_name ILIKE ${like}
                 OR array_to_string(j.required_skills, ' ') ILIKE ${like} OR j.locality_text ILIKE ${like})`);
  }
  const { rows } = await db.query(
    `SELECT j.*, ${dist} AS distance_km, s.job_id AS saved, a.status AS my_status
       FROM job_listings j
       JOIN users e ON e.id = j.employer_id AND e.deleted_at IS NULL AND NOT e.is_suspended
       LEFT JOIN localities l ON l.id = j.locality_id
       LEFT JOIN saved_jobs s ON s.job_id = j.id AND s.user_id = ${me}
       LEFT JOIN job_applications a ON a.job_id = j.id AND a.applicant_user_id = ${me}
      WHERE ${where.join(' AND ')}
      ORDER BY j.created_at DESC LIMIT 200`,
    params,
  );
  let jobs = rows.map((r) => jobDto(r, { showContact: false }));
  if (f.maxKm && f.localityId) jobs = jobs.filter((j) => j.distanceKm == null || j.distanceKm <= f.maxKm!);
  if (f.localityId) jobs.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
  return jobs;
}

export async function getJob(db: Db, actor: Actor | null, id: string) {
  if (!uuid.safeParse(id).success) throw notFound();
  const { rows } = await db.query(
    `SELECT j.*, s.job_id AS saved, a.status AS my_status FROM job_listings j
       LEFT JOIN saved_jobs s ON s.job_id = j.id AND s.user_id = $2
       LEFT JOIN job_applications a ON a.job_id = j.id AND a.applicant_user_id = $2
      WHERE j.id = $1`,
    [id, actor?.id || null],
  );
  const j = rows[0];
  const isOwner = actor && j && (j.employer_id === actor.id || actor.role === 'admin');
  if (!j || (j.status !== 'open' && !isOwner)) throw notFound();
  // Contact details are shown only to signed-in workers (limits scraping) and the owner.
  return { ...jobDto(j, { showContact: !!actor && (actor.role === 'worker' || !!isOwner) }), isOwner: !!isOwner };
}

async function resolveJobLocality(db: Db, input: z.infer<typeof jobSchema>) {
  if (input.localityId) {
    const { rows } = await db.query('SELECT id, name, city FROM localities WHERE id = $1', [input.localityId]);
    if (!rows[0]) throw badRequest('validation_failed', { localityId: 'invalid' });
    return { id: rows[0].id, name: rows[0].name, city: rows[0].city };
  }
  return { id: null, name: input.localityText!, city: input.city };
}

export async function createJob(db: Db, actor: Actor, input: z.infer<typeof jobSchema>) {
  if (actor.role !== 'employer') throw forbidden('wrong_role');
  const loc = await resolveJobLocality(db, input);
  if (input.tradeSlug) {
    const { rows } = await db.query('SELECT 1 FROM service_categories WHERE slug = $1', [input.tradeSlug]);
    if (!rows[0]) throw badRequest('validation_failed', { tradeSlug: 'invalid' });
  }
  const ba = await db.query('SELECT id, business_name FROM business_accounts WHERE contact_person_id = $1 LIMIT 1', [actor.id]);
  const { rows } = await db.query(
    `INSERT INTO job_listings(employer_id, business_account_id, organisation_name, title, duties, trade_slug, locality_id,
        locality_text, city, required_skills, employment_type, pay_min, pay_max, pay_period, schedule, openings,
        application_method, contact_value, closes_on)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING id`,
    [
      actor.id,
      ba.rows[0]?.id || null,
      ba.rows[0]?.business_name || actor.name,
      input.title,
      input.duties,
      input.tradeSlug || null,
      loc.id,
      loc.name,
      loc.city,
      input.requiredSkills,
      input.employmentType,
      input.payMin ?? null,
      input.payMax ?? null,
      input.payPeriod,
      input.schedule,
      input.openings,
      input.applicationMethod,
      input.applicationMethod === 'in_app' ? null : input.contactValue,
      input.closesOn || null,
    ],
  );
  return { id: rows[0].id as string };
}

async function loadOwnJob(db: Db, actor: Actor, id: string) {
  if (!uuid.safeParse(id).success) throw notFound();
  const { rows } = await db.query('SELECT * FROM job_listings WHERE id = $1', [id]);
  if (!rows[0] || (rows[0].employer_id !== actor.id && actor.role !== 'admin')) throw notFound();
  return rows[0];
}

export async function updateJob(db: Db, actor: Actor, id: string, input: z.infer<typeof jobSchema>) {
  await loadOwnJob(db, actor, id);
  const loc = await resolveJobLocality(db, input);
  await db.query(
    `UPDATE job_listings SET title = $2, duties = $3, trade_slug = $4, locality_id = $5, locality_text = $6, city = $7,
        required_skills = $8, employment_type = $9, pay_min = $10, pay_max = $11, pay_period = $12, schedule = $13,
        openings = $14, application_method = $15, contact_value = $16, closes_on = $17, updated_at = NOW()
      WHERE id = $1`,
    [
      id,
      input.title,
      input.duties,
      input.tradeSlug || null,
      loc.id,
      loc.name,
      loc.city,
      input.requiredSkills,
      input.employmentType,
      input.payMin ?? null,
      input.payMax ?? null,
      input.payPeriod,
      input.schedule,
      input.openings,
      input.applicationMethod,
      input.applicationMethod === 'in_app' ? null : input.contactValue,
      input.closesOn || null,
    ],
  );
}

export async function setJobStatus(db: Db, actor: Actor, id: string, status: 'open' | 'paused' | 'closed') {
  await loadOwnJob(db, actor, id);
  await db.query('UPDATE job_listings SET status = $2, updated_at = NOW() WHERE id = $1', [id, status]);
}

export async function listMyJobs(db: Db, actor: Actor) {
  if (actor.role !== 'employer') throw forbidden('wrong_role');
  const { rows } = await db.query(
    `SELECT j.*, (SELECT COUNT(*)::int FROM job_applications a WHERE a.job_id = j.id AND a.status <> 'withdrawn') AS application_count
       FROM job_listings j WHERE j.employer_id = $1 ORDER BY j.created_at DESC`,
    [actor.id],
  );
  return rows.map((r) => jobDto(r, { showContact: true }));
}

export async function toggleSavedJob(db: Db, actor: Actor, jobId: string, save: boolean) {
  if (actor.role !== 'worker') throw forbidden('wrong_role');
  if (!uuid.safeParse(jobId).success) throw notFound();
  if (save) {
    const { rows } = await db.query(`SELECT 1 FROM job_listings WHERE id = $1 AND status = 'open'`, [jobId]);
    if (!rows[0]) throw notFound();
    await db.query('INSERT INTO saved_jobs(user_id, job_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [actor.id, jobId]);
  } else {
    await db.query('DELETE FROM saved_jobs WHERE user_id = $1 AND job_id = $2', [actor.id, jobId]);
  }
}

export const applySchema = z.object({ coverNote: z.string().trim().max(1000).optional() });

export async function applyToJob(db: Db, actor: Actor, jobId: string, input: z.infer<typeof applySchema>) {
  if (actor.role !== 'worker' || !actor.workerId) throw forbidden('worker_profile_missing');
  if (!uuid.safeParse(jobId).success) throw notFound();
  try {
    return await db.transaction(async (tx) => {
      const { rows } = await tx.query(`SELECT * FROM job_listings WHERE id = $1`, [jobId]);
      const j = rows[0];
      if (!j || j.status !== 'open') throw conflict('job_closed');
      if (j.application_method !== 'in_app') throw conflict('apply_outside_app');
      const ins = await tx.query(
        `INSERT INTO job_applications(job_id, worker_id, applicant_user_id, cover_note) VALUES ($1, $2, $3, $4) RETURNING id`,
        [jobId, actor.workerId, actor.id, input.coverNote || null],
      );
      const appId: string = ins.rows[0].id;
      await tx.query('INSERT INTO job_application_status_history(application_id, status, changed_by_user_id) VALUES ($1, $2, $3)', [appId, 'submitted', actor.id]);
      const conv = await ensureConversation(tx, { jobApplicationId: appId }, [actor.id, j.employer_id]);
      await systemMessage(tx, conv, 'sys.application_submitted', { title: j.title });
      await notify(tx, j.employer_id, 'application_received', { title: j.title, worker: actor.name }, `/employer/jobs/${jobId}`);
      return { id: appId, conversationId: conv };
    });
  } catch (e) {
    if (isUniqueViolation(e)) throw conflict('already_applied');
    throw e;
  }
}

export async function listMyApplications(db: Db, actor: Actor) {
  if (actor.role !== 'worker') throw forbidden('wrong_role');
  const { rows } = await db.query(
    `SELECT a.id, a.status, a.cover_note, a.created_at, a.updated_at, j.id AS job_id, j.title, j.organisation_name,
            j.locality_text, j.city, j.employment_type, j.status AS job_status, c.id AS conversation_id
       FROM job_applications a JOIN job_listings j ON j.id = a.job_id
       LEFT JOIN conversations c ON c.job_application_id = a.id
      WHERE a.applicant_user_id = $1 ORDER BY a.created_at DESC`,
    [actor.id],
  );
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    coverNote: r.cover_note,
    appliedAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    conversationId: r.conversation_id,
    job: { id: r.job_id, title: r.title, organisationName: r.organisation_name, locality: r.locality_text, city: r.city, employmentType: r.employment_type, status: r.job_status },
  }));
}

export async function withdrawApplication(db: Db, actor: Actor, appId: string) {
  if (!uuid.safeParse(appId).success) throw notFound();
  const { rows } = await db.query(
    `UPDATE job_applications SET status = 'withdrawn', updated_at = NOW()
      WHERE id = $1 AND applicant_user_id = $2 AND status NOT IN ('hired', 'rejected', 'withdrawn') RETURNING id`,
    [appId, actor.id],
  );
  if (!rows[0]) throw notFound();
  await db.query('INSERT INTO job_application_status_history(application_id, status, changed_by_user_id) VALUES ($1, $2, $3)', [appId, 'withdrawn', actor.id]);
}

/** Employer view of applicants: professional profile summary, no phone number. */
export async function listApplicationsForJob(db: Db, actor: Actor, jobId: string) {
  const job = await loadOwnJob(db, actor, jobId);
  const { rows } = await db.query(
    `SELECT a.*, wp.full_name, wp.avatar_url, wp.category_slug, wp.experience_years, wp.locality, wp.city, wp.skills,
            wp.headline, wp.verification_status, wp.completed_jobs_count, c.id AS conversation_id
       FROM job_applications a JOIN worker_profiles wp ON wp.id = a.worker_id
       LEFT JOIN conversations c ON c.job_application_id = a.id
      WHERE a.job_id = $1 ORDER BY a.created_at DESC`,
    [jobId],
  );
  // Opening the list marks new applications as viewed.
  await db.query(`UPDATE job_applications SET status = 'viewed', updated_at = NOW() WHERE job_id = $1 AND status = 'submitted'`, [jobId]);
  return {
    job: jobDto(job, { showContact: true }),
    applications: rows.map((r) => ({
      id: r.id,
      status: r.status === 'submitted' ? 'viewed' : r.status,
      coverNote: r.cover_note,
      employerNote: r.employer_note,
      appliedAt: iso(r.created_at),
      conversationId: r.conversation_id,
      worker: {
        id: r.worker_id,
        fullName: r.full_name,
        avatarUrl: r.avatar_url,
        category: r.category_slug,
        experienceYears: r.experience_years,
        locality: r.locality,
        city: r.city,
        skills: r.skills || [],
        headline: r.headline,
        verificationStatus: r.verification_status,
        completedJobsCount: r.completed_jobs_count,
      },
    })),
  };
}

const EMPLOYER_SETTABLE = APPLICATION_STATUSES.filter((s) => !['submitted', 'withdrawn'].includes(s));

export const applicationUpdateSchema = z.object({
  status: z.enum(EMPLOYER_SETTABLE as [string, ...string[]]),
  employerNote: z.string().trim().max(1000).optional(),
});

export async function updateApplication(db: Db, actor: Actor, appId: string, input: z.infer<typeof applicationUpdateSchema>) {
  if (!uuid.safeParse(appId).success) throw notFound();
  await db.transaction(async (tx) => {
    const { rows } = await tx.query(
      `SELECT a.*, j.employer_id, j.title FROM job_applications a JOIN job_listings j ON j.id = a.job_id WHERE a.id = $1 FOR UPDATE OF a`,
      [appId],
    );
    const a = rows[0];
    if (!a || (a.employer_id !== actor.id && actor.role !== 'admin')) throw notFound();
    if (a.status === 'withdrawn') throw conflict('application_withdrawn');
    await tx.query('UPDATE job_applications SET status = $2, employer_note = COALESCE($3, employer_note), updated_at = NOW() WHERE id = $1', [
      appId,
      input.status,
      input.employerNote ?? null,
    ]);
    if (a.status !== input.status) {
      await tx.query('INSERT INTO job_application_status_history(application_id, status, changed_by_user_id) VALUES ($1, $2, $3)', [appId, input.status, actor.id]);
      await notify(tx, a.applicant_user_id, 'application_status', { title: a.title, status: input.status }, '/worker/applications');
      const conv = await ensureConversation(tx, { jobApplicationId: appId }, [a.applicant_user_id, a.employer_id]);
      await systemMessage(tx, conv, 'sys.application_status', { status: input.status });
    }
  });
}

/** Workers' nearby open jobs that match their trade or skills. */
export async function recommendedJobs(db: Db, actor: Actor & { workerId: string }) {
  const { rows } = await db.query('SELECT category_slug, city, locality_id, skills FROM worker_profiles WHERE id = $1', [actor.workerId]);
  const w = rows[0];
  const jobs = await searchJobs(db, actor, { city: w.city, localityId: w.locality_id || undefined });
  const skills = new Set((w.skills || []).map((s: string) => s.toLowerCase()));
  return jobs
    .map((j) => ({ ...j, matchesTrade: j.trade === w.category_slug, skillMatches: j.requiredSkills.filter((s: string) => skills.has(s.toLowerCase())).length }))
    .sort((a, b) => Number(b.matchesTrade) - Number(a.matchesTrade) || b.skillMatches - a.skillMatches || (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9))
    .slice(0, 20);
}
