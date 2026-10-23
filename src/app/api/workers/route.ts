import { searchSchema, searchWorkers } from '@/server/services/workers';
import { route, query, rateLimit, clientIp } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, req }) => {
  rateLimit(`search:${clientIp(req)}`, 120, 60_000);
  const params = Object.fromEntries(query(req).entries());
  for (const k of Object.keys(params)) if (params[k] === '') delete params[k];
  return searchWorkers(db, searchSchema.parse(params));
});
