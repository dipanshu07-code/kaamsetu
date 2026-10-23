import { requireActor } from '@/server/auth';
import { cancelRequest, getRequestForCustomer } from '@/server/services/requests';
import { route } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor, params }) => ({ request: await getRequestForCustomer(db, requireActor(actor), params.id) }));

export const DELETE = route(async ({ db, actor, params }) => {
  await cancelRequest(db, requireActor(actor, ['customer']), params.id);
  return { ok: true };
});
