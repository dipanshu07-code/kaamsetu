import { requireActor } from '@/server/auth';
import { adminOverview } from '@/server/services/admin';
import { route } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor }) => ({ overview: await adminOverview(db, requireActor(actor, ['admin'])) }));
