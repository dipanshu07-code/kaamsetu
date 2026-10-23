import { NextResponse } from 'next/server';
import { login, loginSchema } from '@/server/services/accounts';
import { route, readJson, rateLimit, clientIp, withSessionCookie } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = route(async ({ db, req }) => {
  const input = await readJson(req, loginSchema);
  rateLimit(`login-ip:${clientIp(req)}`, 50, 900_000);
  rateLimit(`login:${input.phone}`, 10, 900_000);
  const session = await login(db, input);
  return withSessionCookie(NextResponse.json({ ok: true }), session.token, session.expires);
});
