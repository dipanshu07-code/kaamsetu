import { createPgliteDb, runMigrations, Db } from '@/server/db';
import { seedDemoData, DEMO_PHONES, demoPassword } from '@/server/seed';
import { actorFromToken, Actor } from '@/server/auth';
import { login, signup } from '@/server/services/accounts';
import { istDate, istToDate, istWeekday } from '@/lib/domain';

export async function freshDb(): Promise<Db> {
  const db = await createPgliteDb('memory');
  await runMigrations(db);
  await seedDemoData(db);
  return db;
}

export async function loginAs(db: Db, phone: string, password = demoPassword()): Promise<Actor> {
  const s = await login(db, { phone, password });
  return (await actorFromToken(db, s.token))!;
}

export const demo = DEMO_PHONES;

let phoneCounter = 7000000000;
export async function newUser(db: Db, role: 'customer' | 'worker' | 'employer', extra: Record<string, unknown> = {}): Promise<Actor> {
  const phone = String(phoneCounter++);
  const loc = (await db.query(`SELECT id FROM localities WHERE name = 'Lajpat Nagar'`)).rows[0].id;
  const { session } = await signup(db, {
    role,
    fullName: `Test ${role} ${phone.slice(-3)}`,
    phone,
    password: 'password-123',
    city: 'Delhi NCR',
    localityId: loc,
    language: 'en',
    acceptPrivacy: true,
    organisationName: role === 'employer' ? 'Test Builders' : undefined,
    categorySlug: role === 'worker' ? 'electrician' : undefined,
    ...extra,
  } as any);
  return (await actorFromToken(db, session.token))!;
}

/** A date `daysAhead`+ days from now that falls on `weekday` (IST), at minuteOfDay IST. */
export function futureSlot(weekday: number, minuteOfDay: number, daysAhead = 2) {
  let d = new Date(Date.now() + daysAhead * 86400_000);
  while (istWeekday(d) !== weekday) d = new Date(d.getTime() + 86400_000);
  return istToDate(istDate(d), minuteOfDay);
}

export async function workerIdByPhone(db: Db, phone: string) {
  return (await db.query('SELECT id FROM worker_profiles WHERE phone = $1', [phone])).rows[0].id as string;
}

export const address = { house: 'Flat 12, Block C', locality: 'Lajpat Nagar', city: 'Delhi NCR', pincode: '110024' };

export async function expectCode(p: Promise<unknown>, code: string) {
  try {
    await p;
  } catch (e: any) {
    if (e?.code === code) return;
    throw new Error(`Expected error ${code}, got ${e?.code || e?.message}`);
  }
  throw new Error(`Expected error ${code}, but call succeeded`);
}
