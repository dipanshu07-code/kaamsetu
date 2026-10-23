import { requireActor } from '@/server/auth';
import { applySchema, applyToJob } from '@/server/services/jobs';
import { route, readJson, rateLimit } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = route(async ({ db, actor, params, req }) => {
  const a = requireActor(actor, ['worker']);
  rateLimit(`apply:${a.id}`, 30, 86400_000);
  return applyToJob(db, a, params.id, await readJson(req, applySchema));
});
