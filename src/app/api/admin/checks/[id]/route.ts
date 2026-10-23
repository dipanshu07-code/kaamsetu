import { requireActor } from '@/server/auth';
import { adminDecideCheck, decideSchema } from '@/server/services/verification';
import { route, readJson } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = route(async ({ db, actor, params, req }) => {
  await adminDecideCheck(db, requireActor(actor, ['admin']), params.id, await readJson(req, decideSchema));
  return { ok: true };
});
