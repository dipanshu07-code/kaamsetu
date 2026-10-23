import { requireWorker } from '@/server/auth';
import { respondSchema, respondToAlert } from '@/server/services/requests';
import { route, readJson } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = route(async ({ db, actor, req, params }) =>
  respondToAlert(db, requireWorker(actor), params.matchId, await readJson(req, respondSchema)),
);
