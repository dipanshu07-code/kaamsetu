import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Db } from '@/server/db';
import * as B from '@/server/services/bookings';
import * as W from '@/server/services/workers';
import * as C from '@/server/services/chat';
import { address, demo, expectCode, freshDb, futureSlot, loginAs, newUser, workerIdByPhone } from './helpers';

let db: Db;
let ramesh: string;

beforeAll(async () => {
  db = await freshDb();
  ramesh = await workerIdByPhone(db, demo.worker);
}, 60_000);
afterAll(async () => db?.close());

const book = (actor: any, start: Date, minutes = 60, extra = {}) =>
  B.createBooking(db, actor, {
    workerId: ramesh,
    serviceTitle: 'Fan installation',
    start: start.toISOString(),
    durationMinutes: minutes,
    address,
    description: 'Install one ceiling fan in bedroom',
    paymentMethod: 'cash_on_completion',
    ...extra,
  });

describe('booking lifecycle, negotiation and conflict-free scheduling', () => {
  it('requires both sides to agree a price before a booking is confirmed', async () => {
    const customer = await loginAs(db, demo.customer);
    const worker = await loginAs(db, demo.worker);
    const start = futureSlot(1, 10 * 60); // Monday 10:00 IST

    const b = await book(customer, start);
    expect(b.status).toBe('pending');
    // Worker sees locality only, not the house address, before accepting.
    const asWorker = await B.getBooking(db, worker, b.id);
    expect(asWorker.address.house).toBeNull();
    expect(asWorker.customer.phone).toBeNull();

    // Customer cannot accept their own booking; worker accepts.
    await expectCode(B.acceptBooking(db, customer, b.id), 'only_worker');
    const accepted = await B.acceptBooking(db, worker, b.id);
    expect(accepted.status).toBe('accepted');
    expect(accepted.address.house).toBe(address.house);

    // A chat message saying "deal" does not confirm anything.
    await C.sendMessage(db, customer, accepted.conversationId!, { body: 'OK deal, 400 is fine' });
    expect((await B.getBooking(db, customer, b.id)).status).toBe('accepted');

    // Offer → counteroffer → acceptance.
    const o1 = await B.proposeOffer(db, customer, b.id, { priceType: 'visit', amount: 400 });
    const firstOffer = o1.offers.find((o) => o.status === 'open')!;
    await expectCode(B.respondOffer(db, customer, firstOffer.id, 'accept'), 'cannot_answer_own_offer');
    const o2 = await B.proposeOffer(db, worker, b.id, { priceType: 'visit', amount: 450, note: 'Includes wiring check' });
    expect(o2.offers.find((o) => o.id === firstOffer.id)!.status).toBe('superseded');
    const counter = o2.offers.find((o) => o.status === 'open')!;
    await expectCode(B.respondOffer(db, worker, firstOffer.id, 'accept'), 'offer_not_open');
    const confirmed = await B.respondOffer(db, customer, counter.id, 'accept');
    expect(confirmed.status).toBe('confirmed');
    expect(confirmed.agreedPrice).toBe(450);
    expect(confirmed.priceType).toBe('visit');
    // Contact numbers are shared only once confirmed.
    expect(confirmed.worker.phone).toBe(demo.worker);
  });

  it('blocks a second customer from booking an overlapping confirmed slot', async () => {
    const other = await newUser(db, 'customer');
    const start = futureSlot(1, 10 * 60 + 30); // overlaps the confirmed 10:00–11:00
    await expectCode(book(other, start), 'slot_unavailable');
    // The public calendar shows the busy period without any booking details.
    const avail = await W.getAvailability(db, ramesh, null, 14);
    expect(avail.unavailable.length).toBeGreaterThan(0);
    expect(Object.keys(avail.unavailable[0]).sort()).toEqual(['end', 'start']);
  });

  it('rejects slots outside working hours (Sunday, lunch break)', async () => {
    const c = await newUser(db, 'customer');
    await expectCode(book(c, futureSlot(0, 10 * 60)), 'slot_unavailable');
    await expectCode(book(c, futureSlot(2, 12 * 60 + 30)), 'slot_unavailable'); // 12:30–13:30 crosses the 13:00 break
  });

  it('lets only one of two overlapping pending requests be accepted, even concurrently', async () => {
    const worker = await loginAs(db, demo.worker);
    const c1 = await newUser(db, 'customer');
    const c2 = await newUser(db, 'customer');
    const start = futureSlot(3, 15 * 60); // Wednesday 15:00
    const b1 = await book(c1, start, 60);
    const b2 = await book(c2, new Date(start.getTime() + 30 * 60_000), 60);
    const results = await Promise.allSettled([B.acceptBooking(db, worker, b1.id), B.acceptBooking(db, worker, b2.id)]);
    const ok = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    expect(ok).toHaveLength(1);
    expect(failed[0].reason.code).toBe('slot_unavailable');
  });

  it('enforces the no-overlap rule in the database itself', async () => {
    const start = futureSlot(4, 9 * 60);
    const { rows } = await db.query(`SELECT id FROM users WHERE phone = $1`, [demo.customer]);
    const insert = (s: Date) =>
      db.query(
        `INSERT INTO bookings(booking_number, customer_id, worker_id, service_category_slug, service_title, status, scheduled_date,
           scheduled_time_slot, starts_at, ends_at, address_house, address_locality, address_city, job_description, pricing_basis)
         VALUES (substr(md5(random()::text), 1, 20), $1, $2, 'electrician', 'x', 'confirmed', CURRENT_DATE, 'x', $3, $4, 'h', 'l', 'c', 'd', 'per-visit')`,
        [rows[0].id, ramesh, s, new Date(s.getTime() + 3600_000)],
      );
    await insert(start);
    await expect(insert(new Date(start.getTime() + 15 * 60_000))).rejects.toMatchObject({ code: '23P01' });
  });

  it('releases the slot when a booking is cancelled', async () => {
    const worker = await loginAs(db, demo.worker);
    const c1 = await newUser(db, 'customer');
    const c2 = await newUser(db, 'customer');
    const start = futureSlot(5, 11 * 60);
    const b1 = await book(c1, start);
    await B.acceptBooking(db, worker, b1.id);
    await expectCode(book(c2, start), 'slot_unavailable');
    await expectCode(B.cancelBooking(db, c2, b1.id, 'not mine'), 'not_found');
    const cancelled = await B.cancelBooking(db, c1, b1.id, 'Plans changed');
    expect(cancelled.status).toBe('cancelled');
    const b2 = await book(c2, start);
    expect(b2.status).toBe('pending');
  });

  it('respects blocked time and refuses time off over a confirmed booking', async () => {
    const worker = (await loginAs(db, demo.worker)) as any;
    const c = await newUser(db, 'customer');
    const start = futureSlot(6, 14 * 60);
    await W.addTimeOff(db, worker, { start: start.toISOString(), end: new Date(start.getTime() + 4 * 3600_000).toISOString(), kind: 'time_off' });
    await expectCode(book(c, new Date(start.getTime() + 3600_000)), 'slot_unavailable');
    // Monday 10:00 is confirmed from the first test.
    const busy = futureSlot(1, 10 * 60);
    await expectCode(
      W.addTimeOff(db, worker, { start: busy.toISOString(), end: new Date(busy.getTime() + 3600_000).toISOString(), kind: 'blocked' }),
      'conflicts_with_booking',
    );
  });

  it('hides bookings from anyone who is not a party (IDOR)', async () => {
    const owner = await newUser(db, 'customer');
    const stranger = await newUser(db, 'customer');
    const otherWorker = await newUser(db, 'worker');
    const b = await book(owner, futureSlot(2, 9 * 60));
    await expectCode(B.getBooking(db, stranger, b.id), 'not_found');
    await expectCode(B.acceptBooking(db, otherWorker, b.id), 'not_found');
    await expectCode(C.getConversation(db, stranger, b.id), 'not_found');
    const conv = (await B.getBooking(db, owner, b.id)).conversationId!;
    await expectCode(C.getConversation(db, stranger, conv), 'not_found');
    await expectCode(C.sendMessage(db, stranger, conv, { body: 'hi' }), 'not_found');
  });

  it('stops messages and offers once a participant blocks the other', async () => {
    const customer = await newUser(db, 'customer');
    const worker = await loginAs(db, demo.worker);
    const b = await book(customer, futureSlot(2, 16 * 60));
    const conv = (await B.getBooking(db, customer, b.id)).conversationId!;
    await C.sendMessage(db, worker, conv, { body: 'Hello, I can come' });
    const report = await C.reportConversation(db, customer, conv, { reason: 'harassment', details: 'rude', alsoBlock: true });
    expect(report.id).toBeTruthy();
    await expectCode(C.sendMessage(db, worker, conv, { body: 'why?' }), 'blocked');
    await expectCode(B.proposeOffer(db, worker, b.id, { priceType: 'visit', amount: 300 }), 'blocked');
    await expectCode(book(customer, futureSlot(4, 15 * 60)), 'blocked');
  });

  it('is idempotent for retried booking submissions', async () => {
    const c = await newUser(db, 'customer');
    const start = futureSlot(4, 10 * 60);
    const a = await book(c, start, 60, { idempotencyKey: 'retry-key-123' });
    const b = await book(c, start, 60, { idempotencyKey: 'retry-key-123' });
    expect(a.id).toBe(b.id);
  });

  it('allows reviews only for the customer’s own completed bookings, once', async () => {
    const customer = await loginAs(db, demo.customer);
    const worker = await loginAs(db, demo.worker);
    const { rows } = await db.query(`SELECT id FROM bookings WHERE status = 'confirmed' AND customer_id = $1 LIMIT 1`, [customer.id]);
    const id = rows[0].id;
    const review = { rating: 5, punctuality: 5, quality: 4, politeness: 5, comment: 'Good work' };
    await expectCode(B.reviewBooking(db, customer, id, review), 'review_not_allowed');
    await db.query(`UPDATE bookings SET starts_at = NOW() + interval '30 minutes', ends_at = NOW() + interval '90 minutes' WHERE id = $1`, [id]);
    await B.startBooking(db, worker, id);
    await B.completeBooking(db, worker, id, 'Fan installed and tested');
    await B.reviewBooking(db, customer, id, review);
    await expectCode(B.reviewBooking(db, customer, id, review), 'already_reviewed');
    const profile = await W.getWorkerPublic(db, ramesh);
    expect(profile.reviewCount).toBe(1);
    expect(profile.rating).toBe(5);
    expect(profile.workHistory.length).toBe(1);
  });
});
