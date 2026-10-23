import { NextResponse } from 'next/server';
import { destroySession, SESSION_COOKIE } from '@/server/auth';
import { route, withSessionCookie } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = route(async ({ db, req }) => {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) await destroySession(db, token);
  return withSessionCookie(NextResponse.json({ ok: true }), null);
});
