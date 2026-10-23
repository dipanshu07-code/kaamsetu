import { requireActor } from '@/server/auth';
import { adminListComplaints } from '@/server/services/support';
import { route } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor }) => ({ complaints: await adminListComplaints(db, requireActor(actor, ['admin'])) }));
