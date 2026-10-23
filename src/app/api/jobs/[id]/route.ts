import { z } from 'zod';
import { requireActor } from '@/server/auth';
import { getJob, jobSchema, setJobStatus, updateJob } from '@/server/services/jobs';
import { route, readJson } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor, params }) => ({ job: await getJob(db, actor, params.id) }));

export const PUT = route(async ({ db, actor, params, req }) => {
  const a = requireActor(actor, ['employer', 'admin']);
  await updateJob(db, a, params.id, await readJson(req, jobSchema));
  return { job: await getJob(db, a, params.id) };
});

export const PATCH = route(async ({ db, actor, params, req }) => {
  const a = requireActor(actor, ['employer', 'admin']);
  const { status } = await readJson(req, z.object({ status: z.enum(['open', 'paused', 'closed']) }));
  await setJobStatus(db, a, params.id, status);
  return { job: await getJob(db, a, params.id) };
});
