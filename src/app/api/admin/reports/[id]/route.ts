import { requireActor } from '@/server/auth';
import { adminUpdateReport, reportUpdateSchema } from '@/server/services/admin';
import { adminViewReport } from '@/server/services/chat';
import { route, readJson } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor, params }) => ({ report: await adminViewReport(db, requireActor(actor, ['admin']), params.id) }));

export const POST = route(async ({ db, actor, params, req }) => {
  await adminUpdateReport(db, requireActor(actor, ['admin']), params.id, await readJson(req, reportUpdateSchema));
  return { ok: true };
});
