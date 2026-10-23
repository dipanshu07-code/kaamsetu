import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Db } from '@/server/db';
import * as R from '@/server/services/requests';
import * as B from '@/server/services/bookings';
import * as W from '@/server/services/workers';
import * as J from '@/server/services/jobs';
import * as V from '@/server/services/verification';
import * as S from '@/server/services/support';
import * as A from '@/server/services/accounts';
import * as Admin from '@/server/services/admin';
import { actorFromToken } from '@/server/auth';
import { address, demo, expectCode, freshDb, futureSlot, loginAs, newUser, workerIdByPhone } from './helpers';

let db: Db;
let lajpat: string;

beforeAll(async () => {
  db = await freshDb();
  lajpat = (await db.query(`SELECT id FROM localities WHERE name = 'Lajpat Nagar'`)).rows[0].id;
}, 60_000);
afterAll(async () => db?.close());

describe('on-demand service requests', () => {
  it('alerts nearby eligible plumbers only and hides the address until booking', async () => {
    const customer = await loginAs(db, demo.customer);
    const start = futureSlot(2, 10 * 60);
    const { id, alerted } = await R.createRequest(db, customer, {
      categorySlug: 'plumber',
      problem: 'Kitchen tap leaking continuously',
      localityId: lajpat,
      address,
      start: start.toISOString(),
      durationMinutes: 60,
      priceType: 'visit',
    });
    expect(alerted).toBeGreaterThanOrEqual(1);

    const arjun = (await loginAs(db, demo.plumber)) as any;
    const alerts = await R.listAlertsForWorker(db, arjun);
    const alert = alerts.find((a) => a.request.id === id)!;
    expect(alert).toBeTruthy();
    expect(alert.request.address).toBeNull();
    expect(alert.distanceKm).not.toBeNull();

    // An electrician must not be alerted for a plumbing request.
    const electrician = (await loginAs(db, demo.worker)) as any;
    expect((await R.listAlertsForWorker(db, electrician)).some((a) => a.request.id === id)).toBe(false);

    // Interest with a quote → customer compares → selects → booking with an open offer.
    await R.respondToAlert(db, arjun, alert.matchId, { decision: 'interested', quotePriceType: 'visit', quoteAmount: 350, note: 'Can bring a new cartridge' });
    const view = await R.getRequestForCustomer(db, customer, id);
    expect(view.responses).toHaveLength(1);
    expect(view.responses[0].quote).toEqual({ priceType: 'visit', amount: 350 });
    expect((view.responses[0].worker as any).phone).toBeUndefined();

    const stranger = await newUser(db, 'customer');
    await expectCode(R.getRequestForCustomer(db, stranger, id), 'not_found');
    await expectCode(R.selectWorker(db, stranger, id, alert.matchId), 'not_found');

    const { bookingId } = await R.selectWorker(db, customer, id, alert.matchId);
    const booking = await B.getBooking(db, customer, bookingId);
    expect(booking.status).toBe('accepted');
    expect(booking.agreedPrice).toBeNull();
    const offer = booking.offers.find((o) => o.status === 'open')!;
    expect(offer.amount).toBe(350);
    const confirmed = await B.respondOffer(db, customer, offer.id, 'accept');
    expect(confirmed.status).toBe('confirmed');
    expect((await B.getBooking(db, arjun, bookingId)).address.house).toBe(address.house);

    // Same conversation continues on the booking.
    expect(confirmed.conversationId).toBe(view.responses[0].conversationId);
  });

  it('does not alert workers who are busy at the requested time', async () => {
    const customer = await newUser(db, 'customer');
    const arjunId = await workerIdByPhone(db, demo.plumber);
    const start = futureSlot(2, 10 * 60); // Arjun is confirmed here from the previous test
    const { id } = await R.createRequest(db, customer, {
      categorySlug: 'plumber',
      problem: 'Bathroom flush not working',
      localityId: lajpat,
      address,
      start: start.toISOString(),
      durationMinutes: 60,
    });
    const { rows } = await db.query('SELECT worker_id FROM service_request_workers WHERE request_id = $1', [id]);
    expect(rows.map((r) => r.worker_id)).not.toContain(arjunId);
  });
});

describe('childcare safeguarding', () => {
  it('keeps childcare workers hidden and unbookable until every required check passes', async () => {
    const admin = await loginAs(db, demo.admin);
    await Admin.adminToggleCategory(db, admin, 'childcare', { enabled: true });
    const sitter = (await newUser(db, 'worker', { categorySlug: 'childcare' })) as any;
    const customer = await newUser(db, 'customer');

    const search = async () => (await W.searchWorkers(db, { category: 'childcare', localityId: lajpat })).workers.map((w) => w.id);
    expect(await search()).not.toContain(sitter.workerId);
    await expectCode(
      B.createBooking(db, customer, {
        workerId: sitter.workerId,
        serviceTitle: 'Babysitting',
        start: futureSlot(3, 10 * 60).toISOString(),
        durationMinutes: 120,
        address,
        description: 'Evening babysitting for a 4 year old',
        paymentMethod: 'cash_on_completion',
      }),
      'worker_not_eligible',
    );

    // Worker gives consent and submits each required check.
    const required = [
      { type: 'identity', slot: 1 },
      { type: 'reference', slot: 1 },
      { type: 'reference', slot: 2 },
      { type: 'police', slot: 1 },
      { type: 'first_aid', slot: 1 },
      { type: 'safeguarding_training', slot: 1 },
    ] as const;
    for (const r of required) {
      await V.requestCheck(db, sitter, {
        type: r.type,
        slot: r.slot,
        consent: true,
        reference: r.type === 'reference' ? { name: 'Referee Name', relation: 'Former employer', phone: '9876543210' } : undefined,
      });
    }
    const pending = (await V.adminListChecks(db, admin)).filter((c) => c.workerId === sitter.workerId);
    expect(pending).toHaveLength(6);

    // Police check needs an expiry date; non-admins cannot decide checks.
    const police = pending.find((c) => c.type === 'police')!;
    await expectCode(V.adminDecideCheck(db, sitter, police.id, { outcome: 'passed', method: 'police_certificate_sighted', notes: 'Seen' }), 'forbidden');
    await expectCode(
      V.adminDecideCheck(db, admin, police.id, { outcome: 'passed', method: 'police_certificate_sighted', notes: 'Certificate seen' }),
      'validation_failed',
    );

    const nextYear = new Date(Date.now() + 300 * 86400_000).toISOString().slice(0, 10);
    for (const c of pending.slice(0, 5)) {
      await V.adminDecideCheck(db, admin, c.id, {
        outcome: 'passed',
        method: c.type === 'reference' ? 'reference_phone_call' : 'certificate_sighted',
        notes: 'Checked in person',
        expiresAt: c.validMonths ? nextYear : null,
      });
    }
    expect(await search()).not.toContain(sitter.workerId); // one check still missing
    const last = pending[5];
    await V.adminDecideCheck(db, admin, last.id, { outcome: 'passed', method: 'certificate_sighted', notes: 'Checked', expiresAt: last.validMonths ? nextYear : null });
    expect(await search()).toContain(sitter.workerId);

    // Referee contact details are deleted after the decision.
    const { rows } = await db.query(`SELECT reference_details FROM verification_checks WHERE worker_id = $1 AND check_type = 'reference'`, [sitter.workerId]);
    expect(rows.every((r) => r.reference_details === null)).toBe(true);

    // A safety complaint immediately puts the worker on hold.
    const booking = await B.createBooking(db, customer, {
      workerId: sitter.workerId,
      serviceTitle: 'Babysitting',
      start: futureSlot(3, 10 * 60).toISOString(),
      durationMinutes: 120,
      address,
      description: 'Evening babysitting for a 4 year old',
      paymentMethod: 'cash_on_completion',
    });
    await S.createComplaint(db, customer, { bookingId: booking.id, category: 'safety_concern', subject: 'Concern', description: 'Left the child unattended' });
    expect(await search()).not.toContain(sitter.workerId);
    await expectCode(B.acceptBooking(db, sitter, booking.id), 'worker_not_eligible');
  });

  it('marks expired checks as no longer valid', async () => {
    const sitter = (await newUser(db, 'worker', { categorySlug: 'childcare' })) as any;
    await db.query(
      `INSERT INTO verification_checks(worker_id, check_type, slot, status, consent_given_at, expires_at)
       SELECT $1, t.type, t.slot, 'passed', NOW(), CASE WHEN t.type = 'police' THEN NOW() - interval '1 day' ELSE NOW() + interval '200 days' END
         FROM (VALUES ('identity',1),('reference',1),('reference',2),('police',1),('first_aid',1),('safeguarding_training',1)) AS t(type, slot)`,
      [sitter.workerId],
    );
    const v = await V.getMyVerification(db, sitter);
    expect(v.eligible).toBe(false);
    expect(v.missing.map((m) => m.type)).toEqual(['police']);
    expect(v.checks.find((c) => c.type === 'police')!.status).toBe('expired');
  });
});

describe('employment listings', () => {
  it('runs a separate job → application → status workflow with role checks', async () => {
    const employer = await loginAs(db, demo.employer);
    const otherEmployer = await newUser(db, 'employer');
    const worker = await newUser(db, 'worker', { categorySlug: 'construction', openToJobs: true });
    const customer = await newUser(db, 'customer');

    await expectCode(
      J.createJob(db, customer, { title: 'x', duties: 'y', city: 'Delhi NCR', employmentType: 'full_time', payPeriod: 'month', schedule: 'Mon-Sat' } as any),
      'wrong_role',
    );
    const { id } = await J.createJob(
      db,
      employer,
      J.jobSchema.parse({
        title: 'Bar bender',
        duties: 'Cutting and tying steel for slabs and columns',
        tradeSlug: 'construction',
        localityId: lajpat,
        city: 'Delhi NCR',
        requiredSkills: ['Bar bending'],
        employmentType: 'contract',
        payMin: 800,
        payMax: 1000,
        payPeriod: 'day',
        schedule: 'Mon–Sat, 9–6',
      }),
    );
    const list = await J.searchJobs(db, worker, { employmentType: 'contract', localityId: lajpat });
    expect(list.some((j) => j.id === id)).toBe(true);

    await J.toggleSavedJob(db, worker, id, true);
    expect((await J.searchJobs(db, worker, { savedOnly: true })).map((j) => j.id)).toEqual([id]);

    await expectCode(J.applyToJob(db, customer, id, {}), 'worker_profile_missing');
    const app = await J.applyToJob(db, worker, id, { coverNote: '5 years bar bending experience' });
    await expectCode(J.applyToJob(db, worker, id, {}), 'already_applied');

    await expectCode(J.listApplicationsForJob(db, otherEmployer, id), 'not_found');
    const apps = await J.listApplicationsForJob(db, employer, id);
    expect(apps.applications).toHaveLength(1);
    expect((apps.applications[0].worker as any).phone).toBeUndefined();

    await expectCode(J.updateApplication(db, otherEmployer, app.id, { status: 'hired' }), 'not_found');
    await J.updateApplication(db, employer, app.id, { status: 'shortlisted' });
    const mine = await J.listMyApplications(db, worker);
    expect(mine[0].status).toBe('shortlisted');

    // Jobs never create bookings.
    const { rows } = await db.query('SELECT COUNT(*)::int AS n FROM bookings WHERE customer_id = $1', [employer.id]);
    expect(rows[0].n).toBe(0);
  });
});

describe('accounts and privacy', () => {
  it('rejects bad credentials with a generic error and duplicate phones', async () => {
    await expectCode(A.login(db, { phone: demo.customer, password: 'wrong-password' }), 'invalid_credentials');
    await expectCode(A.login(db, { phone: '9999999999', password: 'whatever-1' }), 'invalid_credentials');
    await expect(
      A.signup(db, A.signupSchema.parse({ role: 'customer', fullName: 'Dup', phone: demo.customer, password: 'password-123', city: 'Delhi NCR', localityId: lajpat, acceptPrivacy: true })),
    ).rejects.toMatchObject({ code: 'phone_taken' });
  });

  it('cannot self-register as admin', () => {
    expect(() =>
      A.signupSchema.parse({ role: 'admin', fullName: 'Evil', phone: '9123456780', password: 'password-123', city: 'Delhi NCR', localityId: lajpat, acceptPrivacy: true }),
    ).toThrow();
  });

  it('never exposes worker phone numbers in public search or profiles', async () => {
    const res = await W.searchWorkers(db, { localityId: lajpat });
    expect(JSON.stringify(res)).not.toContain(demo.worker);
    const profile = await W.getWorkerPublic(db, await workerIdByPhone(db, demo.worker));
    expect(JSON.stringify(profile)).not.toContain(demo.worker);
  });

  it('anonymises the account and ends sessions on deletion', async () => {
    const worker = await newUser(db, 'worker');
    const { token } = await A.login(db, { phone: worker.phone, password: 'password-123' });
    await expectCode(A.deleteAccount(db, worker, 'bad-password'), 'wrong_password');
    await A.deleteAccount(db, worker, 'password-123');
    expect(await actorFromToken(db, token)).toBeNull();
    const { rows } = await db.query('SELECT full_name, phone, password_hash FROM users WHERE id = $1', [worker.id]);
    expect(rows[0]).toMatchObject({ full_name: 'Deleted user', password_hash: null });
    expect(rows[0].phone).not.toBe(worker.phone);
  });

  it('lets only admins reset a password, revoking sessions and logging it', async () => {
    const admin = await loginAs(db, demo.admin);
    const user = await newUser(db, 'customer');
    const { token } = await A.login(db, { phone: user.phone, password: 'password-123' });
    await expectCode(Admin.adminResetPassword(db, user, user.id, 'not allowed'), 'forbidden');
    const { temporaryPassword } = await Admin.adminResetPassword(db, admin, user.id, 'Caller verified by phone');
    expect(await actorFromToken(db, token)).toBeNull();
    await expectCode(A.login(db, { phone: user.phone, password: 'password-123' }), 'invalid_credentials');
    expect((await A.login(db, { phone: user.phone, password: temporaryPassword })).token).toBeTruthy();
    const { rows } = await db.query(`SELECT 1 FROM admin_audit_logs WHERE action = 'PASSWORD_RESET' AND target_id = $1`, [user.id]);
    expect(rows).toHaveLength(1);
  });

  it('finds workers by distance when coordinates exist and ranks the nearest first', async () => {
    const gk = (await db.query(`SELECT id FROM localities WHERE name = 'Greater Kailash'`)).rows[0].id;
    const res = await W.searchWorkers(db, { category: 'plumber', localityId: gk, maxKm: 30 });
    expect(res.distanceUsed).toBe(true);
    const d = res.workers.map((w) => w.distanceKm ?? 999);
    expect([...d].sort((a, b) => a - b)).toEqual(d);
  });
});
