import { requireActor } from '@/server/auth';
import { applicationUpdateSchema, updateApplication } from '@/server/services/jobs';
import { route, readJson } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const PATCH = route(async ({ db, actor, params, req }) => {
  await updateApplication(db, requireActor(actor, ['employer', 'admin']), params.id, await readJson(req, applicationUpdateSchema));
  return { ok: true };
});
