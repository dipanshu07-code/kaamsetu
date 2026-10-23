import { requireActor } from '@/server/auth';
import { listApplicationsForJob } from '@/server/services/jobs';
import { route } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor, params }) => listApplicationsForJob(db, requireActor(actor, ['employer', 'admin']), params.id));
