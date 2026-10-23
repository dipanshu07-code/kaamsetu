import { z } from 'zod';
import { requireActor } from '@/server/auth';
import { listNotifications, markNotificationsRead } from '@/server/services/support';
import { route, readJson } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor }) => ({ notifications: await listNotifications(db, requireActor(actor)) }));

export const POST = route(async ({ db, actor, req }) => {
  const { ids } = await readJson(req, z.object({ ids: z.array(z.string()).max(200).optional() }));
  await markNotificationsRead(db, requireActor(actor), ids);
  return { ok: true };
});
