import { requireActor } from '@/server/auth';
import { adminListUsers } from '@/server/services/admin';
import { route, query } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor, req }) => ({ users: await adminListUsers(db, requireActor(actor, ['admin']), query(req).get('q')) }));
