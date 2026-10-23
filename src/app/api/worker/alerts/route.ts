import { requireWorker } from '@/server/auth';
import { listAlertsForWorker } from '@/server/services/requests';
import { route } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor }) => ({ alerts: await listAlertsForWorker(db, requireWorker(actor)) }));
