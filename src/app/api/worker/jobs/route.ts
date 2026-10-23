import { requireWorker } from '@/server/auth';
import { recommendedJobs } from '@/server/services/jobs';
import { route } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor }) => ({ jobs: await recommendedJobs(db, requireWorker(actor)) }));
