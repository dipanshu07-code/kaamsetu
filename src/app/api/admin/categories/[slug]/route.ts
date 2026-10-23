import { requireActor } from '@/server/auth';
import { adminToggleCategory, categoryToggleSchema } from '@/server/services/admin';
import { route, readJson } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = route(async ({ db, actor, params, req }) => {
  await adminToggleCategory(db, requireActor(actor, ['admin']), params.slug, await readJson(req, categoryToggleSchema));
  return { ok: true };
});
