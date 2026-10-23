import { requireWorker } from '@/server/auth';
import { deleteTimeOff } from '@/server/services/workers';
import { route } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const DELETE = route(async ({ db, actor, params }) => {
  await deleteTimeOff(db, requireWorker(actor), params.id);
  return { ok: true };
});
