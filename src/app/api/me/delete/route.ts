import { z } from 'zod';
import { NextResponse } from 'next/server';
import { requireActor } from '@/server/auth';
import { deleteAccount } from '@/server/services/accounts';
import { route, readJson, rateLimit, withSessionCookie } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = route(async ({ db, actor, req }) => {
  const a = requireActor(actor);
  rateLimit(`del:${a.id}`, 5, 3600_000);
  const { password } = await readJson(req, z.object({ password: z.string().min(1).max(100) }));
  await deleteAccount(db, a, password);
  return withSessionCookie(NextResponse.json({ ok: true }), null);
});
