import { z } from 'zod';
import { requireActor } from '@/server/auth';
import { adminSetSuspended } from '@/server/services/admin';
import { route, readJson } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({ suspended: z.boolean(), reason: z.string().trim().min(3).max(500) });

export const POST = route(async ({ db, actor, params, req }) => {
  const input = await readJson(req, schema);
  await adminSetSuspended(db, requireActor(actor, ['admin']), params.id, input.suspended, input.reason);
  return { ok: true };
});
