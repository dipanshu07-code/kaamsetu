import { z } from 'zod';
import { requireActor } from '@/server/auth';
import { adminResetPassword } from '@/server/services/admin';
import { route, readJson, rateLimit } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = route(async ({ db, actor, params, req }) => {
  const a = requireActor(actor, ['admin']);
  rateLimit(`reset:${a.id}`, 30, 3600_000);
  const { reason } = await readJson(req, z.object({ reason: z.string().trim().min(3).max(500) }));
  return adminResetPassword(db, a, params.id, reason);
});
