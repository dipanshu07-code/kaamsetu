import { getAvailability } from '@/server/services/workers';
import { route, query } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, params, req }) => {
  const q = query(req);
  const from = q.get('from');
  return getAvailability(db, params.id, from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : null, Number(q.get('days') || 14));
});
