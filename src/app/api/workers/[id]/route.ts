import { getWorkerPublic } from '@/server/services/workers';
import { route } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, params }) => ({ worker: await getWorkerPublic(db, params.id) }));
