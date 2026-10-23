import { listLocalities } from '@/server/services/accounts';
import { route, query } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, req }) => ({ localities: await listLocalities(db, query(req).get('city')) }));
