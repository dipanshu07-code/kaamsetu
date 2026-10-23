import { requireActor } from '@/server/auth';
import { rematchRequest } from '@/server/services/requests';
import { route, rateLimit } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = route(async ({ db, actor, params }) => {
  const a = requireActor(actor, ['customer']);
  rateLimit(`rematch:${a.id}`, 10, 3600_000);
  return rematchRequest(db, a, params.id);
});
