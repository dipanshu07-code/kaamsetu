import { requireActor } from '@/server/auth';
import { adminListReports } from '@/server/services/admin';
import { route } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor }) => ({ reports: await adminListReports(db, requireActor(actor, ['admin'])) }));
