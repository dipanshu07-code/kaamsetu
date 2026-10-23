import { requireWorker } from '@/server/auth';
import { getMyWorkerProfile, updateMyWorkerProfile, updateProfileSchema } from '@/server/services/workers';
import { route, readJson } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor }) => ({ profile: await getMyWorkerProfile(db, requireWorker(actor)) }));

export const PATCH = route(async ({ db, actor, req }) => {
  const a = requireWorker(actor);
  await updateMyWorkerProfile(db, a, await readJson(req, updateProfileSchema));
  return { profile: await getMyWorkerProfile(db, a) };
});
