import { z } from 'zod';
import { requireActor } from '@/server/auth';
import { notFound } from '@/server/errors';
import * as B from '@/server/services/bookings';
import { route, readJson, rateLimit } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const reason = z.object({ reason: z.string().trim().min(3).max(300) });
const notes = z.object({ notes: z.string().trim().max(1000).optional() });

export const POST = route(async ({ db, actor, req, params }) => {
  const a = requireActor(actor);
  const id = params.id;
  switch (params.action) {
    case 'accept':
      return { booking: await B.acceptBooking(db, a, id) };
    case 'decline':
      return { booking: await B.declineBooking(db, a, id, (await readJson(req, reason)).reason) };
    case 'cancel':
      return { booking: await B.cancelBooking(db, a, id, (await readJson(req, reason)).reason) };
    case 'reschedule':
      return { booking: await B.rescheduleBooking(db, a, id, await readJson(req, B.rescheduleSchema)) };
    case 'start':
      return { booking: await B.startBooking(db, a, id) };
    case 'complete':
      return { booking: await B.completeBooking(db, a, id, (await readJson(req, notes)).notes) };
    case 'dispute':
      return { ticket: await B.disputeBooking(db, a, id, await readJson(req, B.disputeSchema)) };
    case 'review':
      await B.reviewBooking(db, a, id, await readJson(req, B.reviewSchema));
      return { booking: await B.getBooking(db, a, id) };
    case 'offers':
      rateLimit(`offer:${a.id}`, 30, 3600_000);
      return { booking: await B.proposeOffer(db, a, id, await readJson(req, B.offerSchema)) };
    default:
      throw notFound();
  }
});
