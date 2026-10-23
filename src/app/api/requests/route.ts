import { requireActor } from '@/server/auth';
import { createRequest, createRequestSchema, listMyRequests } from '@/server/services/requests';
import { route, readJson, rateLimit } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor }) => ({ requests: await listMyRequests(db, requireActor(actor, ['customer'])) }));

export const POST = route(async ({ db, actor, req }) => {
  const a = requireActor(actor, ['customer']);
  rateLimit(`request:${a.id}`, 10, 3600_000);
  return createRequest(db, a, await readJson(req, createRequestSchema));
});
