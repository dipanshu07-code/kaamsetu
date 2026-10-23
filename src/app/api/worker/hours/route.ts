import { requireWorker } from '@/server/auth';
import { setWorkingHours, workingHoursSchema } from '@/server/services/workers';
import { route, readJson } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const PUT = route(async ({ db, actor, req }) => {
  await setWorkingHours(db, requireWorker(actor), await readJson(req, workingHoursSchema));
  return { ok: true };
});
