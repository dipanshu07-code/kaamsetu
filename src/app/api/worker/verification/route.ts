import { requireWorker } from '@/server/auth';
import { getMyVerification, requestCheck, requestCheckSchema } from '@/server/services/verification';
import { route, readJson, rateLimit } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor }) => getMyVerification(db, requireWorker(actor)));

export const POST = route(async ({ db, actor, req }) => {
  const a = requireWorker(actor);
  rateLimit(`check:${a.id}`, 20, 3600_000);
  await requestCheck(db, a, await readJson(req, requestCheckSchema));
  return getMyVerification(db, a);
});
