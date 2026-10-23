import { requireActor } from '@/server/auth';
import { getMe, updateMe, updateMeSchema } from '@/server/services/accounts';
import { route, readJson } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor }) => ({ user: actor ? await getMe(db, actor) : null }));

export const PATCH = route(async ({ db, actor, req }) => {
  const a = requireActor(actor);
  await updateMe(db, a, await readJson(req, updateMeSchema));
  return { user: await getMe(db, a) };
});
