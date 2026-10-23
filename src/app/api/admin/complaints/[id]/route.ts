import { requireActor } from '@/server/auth';
import { adminUpdateComplaint, complaintUpdateSchema } from '@/server/services/support';
import { route, readJson } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = route(async ({ db, actor, params, req }) => {
  await adminUpdateComplaint(db, requireActor(actor, ['admin']), params.id, await readJson(req, complaintUpdateSchema));
  return { ok: true };
});
