import { requireActor } from '@/server/auth';
import { getConversation, sendMessage, sendSchema } from '@/server/services/chat';
import { route, readJson, query, rateLimit } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor, params, req }) => ({
  conversation: await getConversation(db, requireActor(actor), params.id, query(req).get('after')),
}));

export const POST = route(async ({ db, actor, params, req }) => {
  const a = requireActor(actor);
  rateLimit(`msg:${a.id}`, 30, 60_000);
  return { message: await sendMessage(db, a, params.id, await readJson(req, sendSchema)) };
});
