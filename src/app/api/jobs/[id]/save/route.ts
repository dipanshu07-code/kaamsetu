import { z } from 'zod';
import { requireActor } from '@/server/auth';
import { toggleSavedJob } from '@/server/services/jobs';
import { route, readJson } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = route(async ({ db, actor, params, req }) => {
  const { save } = await readJson(req, z.object({ save: z.boolean() }));
  await toggleSavedJob(db, requireActor(actor, ['worker']), params.id, save);
  return { ok: true };
});
