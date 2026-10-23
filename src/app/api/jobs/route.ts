import { requireActor } from '@/server/auth';
import { createJob, jobSchema, jobSearchSchema, searchJobs } from '@/server/services/jobs';
import { route, readJson, query, rateLimit } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor, req }) => {
  const params = Object.fromEntries(query(req).entries());
  for (const k of Object.keys(params)) if (params[k] === '') delete params[k];
  return { jobs: await searchJobs(db, actor, jobSearchSchema.parse(params)) };
});

export const POST = route(async ({ db, actor, req }) => {
  const a = requireActor(actor, ['employer']);
  rateLimit(`job:${a.id}`, 20, 86400_000);
  return createJob(db, a, await readJson(req, jobSchema));
});
