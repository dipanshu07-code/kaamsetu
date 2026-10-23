import { requireActor } from '@/server/auth';
import { adminAuditLog } from '@/server/services/admin';
import { route } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor }) => ({ logs: await adminAuditLog(db, requireActor(actor, ['admin'])) }));
