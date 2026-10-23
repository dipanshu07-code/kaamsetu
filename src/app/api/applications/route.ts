import { requireActor } from '@/server/auth';
import { listMyApplications } from '@/server/services/jobs';
import { route } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor }) => ({ applications: await listMyApplications(db, requireActor(actor, ['worker'])) }));
