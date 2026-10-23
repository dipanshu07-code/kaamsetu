import { z } from 'zod';
import { requireActor } from '@/server/auth';
import { respondOffer, withdrawOffer } from '@/server/services/bookings';
import { route, readJson } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({ action: z.enum(['accept', 'reject', 'withdraw']) });

export const POST = route(async ({ db, actor, req, params }) => {
  const a = requireActor(actor);
  const { action } = await readJson(req, schema);
  const booking = action === 'withdraw' ? await withdrawOffer(db, a, params.id) : await respondOffer(db, a, params.id, action);
  return { booking };
});
