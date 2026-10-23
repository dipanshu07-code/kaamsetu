import { requireActor } from '@/server/auth';
import { listMyJobs } from '@/server/services/jobs';
import { route } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor }) => ({ jobs: await listMyJobs(db, requireActor(actor, ['employer'])) }));
