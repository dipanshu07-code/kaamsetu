import { z } from 'zod';
import { requireActor } from '@/server/auth';
import { selectWorker } from '@/server/services/requests';
import { route, readJson } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = route(async ({ db, actor, req, params }) => {
  const { matchId } = await readJson(req, z.object({ matchId: z.string().uuid() }));
  return selectWorker(db, requireActor(actor, ['customer']), params.id, matchId);
});
