import { requireActor } from '@/server/auth';
import { complaintSchema, createComplaint, listMyComplaints } from '@/server/services/support';
import { route, readJson, rateLimit } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor }) => ({ complaints: await listMyComplaints(db, requireActor(actor)) }));

export const POST = route(async ({ db, actor, req }) => {
  const a = requireActor(actor);
  rateLimit(`complaint:${a.id}`, 10, 86400_000);
  return createComplaint(db, a, await readJson(req, complaintSchema));
});
