import { z } from 'zod';
import { NextResponse } from 'next/server';
import { requireActor } from '@/server/auth';
import { changePassword } from '@/server/services/accounts';
import { route, readJson, rateLimit, withSessionCookie } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({ current: z.string().min(1).max(100), next: z.string().min(8).max(100) });

export const POST = route(async ({ db, actor, req }) => {
  const a = requireActor(actor);
  rateLimit(`pw:${a.id}`, 10, 3600_000);
  const input = await readJson(req, schema);
  await changePassword(db, a, input.current, input.next);
  // All sessions were revoked; the user signs in again with the new password.
  return withSessionCookie(NextResponse.json({ ok: true }), null);
});
