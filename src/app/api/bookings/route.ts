import { requireActor } from '@/server/auth';
import { createBooking, createBookingSchema, listMyBookings } from '@/server/services/bookings';
import { route, readJson, rateLimit } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor }) => ({ bookings: await listMyBookings(db, requireActor(actor)) }));

export const POST = route(async ({ db, actor, req }) => {
  const a = requireActor(actor, ['customer']);
  rateLimit(`book:${a.id}`, 20, 3600_000);
  return { booking: await createBooking(db, a, await readJson(req, createBookingSchema)) };
});
