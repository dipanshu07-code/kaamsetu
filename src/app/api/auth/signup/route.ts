import { NextResponse } from 'next/server';
import { signup, signupSchema } from '@/server/services/accounts';
import { route, readJson, rateLimit, clientIp, withSessionCookie } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = route(async ({ db, req }) => {
  rateLimit(`signup:${clientIp(req)}`, 10, 3600_000);
  const input = await readJson(req, signupSchema);
  const { session } = await signup(db, input);
  return withSessionCookie(NextResponse.json({ ok: true }), session.token, session.expires);
});
