import { requireActor } from '@/server/auth';
import { reportConversation, reportSchema } from '@/server/services/chat';
import { route, readJson, rateLimit } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = route(async ({ db, actor, params, req }) => {
  const a = requireActor(actor);
  rateLimit(`report:${a.id}`, 10, 86400_000);
  return reportConversation(db, a, params.id, await readJson(req, reportSchema));
});
