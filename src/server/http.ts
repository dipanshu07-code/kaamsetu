import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError, ZodTypeAny } from 'zod';
import { getDb, Db } from './db';
import { Actor, actorFromToken, SESSION_COOKIE } from './auth';
import { ApiError, badRequest, forbidden, tooMany } from './errors';

export interface Ctx {
  db: Db;
  actor: Actor | null;
  req: NextRequest;
  params: Record<string, string>;
}

type Handler = (ctx: Ctx) => Promise<unknown>;

/**
 * Wraps a route handler with: session lookup, same-origin check for writes,
 * consistent JSON errors (stable codes only — no stack traces or SQL errors).
 */
export function route(fn: Handler) {
  return async (req: NextRequest, context: { params: Promise<any> }) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') assertSameOrigin(req);
      const db = await getDb();
      const actor = await actorFromToken(db, req.cookies.get(SESSION_COOKIE)?.value);
      const params: Record<string, string> = (await context?.params) || {};
      const result = await fn({ db, actor, req, params });
      if (result instanceof NextResponse || result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export function errorResponse(e: unknown) {
  if (e instanceof ApiError) {
    return NextResponse.json({ error: { code: e.code, fields: e.fields } }, { status: e.status });
  }
  if (e instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of e.issues) {
      const key = issue.path.join('.') || '_';
      if (!fields[key]) fields[key] = zodCode(issue);
    }
    return NextResponse.json({ error: { code: 'validation_failed', fields } }, { status: 400 });
  }
  // Log only the error class/code, never request bodies or personal data.
  const err = e as { name?: string; code?: string; message?: string };
  console.error('[api] unexpected error', err?.name, err?.code, String(err?.message || '').slice(0, 200));
  return NextResponse.json({ error: { code: 'server_error' } }, { status: 500 });
}

function zodCode(issue: ZodError['issues'][number]): string {
  if (issue.code === 'too_small') return issue.minimum === 1 ? 'required' : 'too_short';
  if (issue.code === 'too_big') return 'too_long';
  if (issue.code === 'invalid_type' && issue.received === 'undefined') return 'required';
  return 'invalid';
}

function assertSameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (!origin) return; // non-browser clients; cookies are SameSite=Lax anyway
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  try {
    if (new URL(origin).host !== host) throw forbidden('bad_origin');
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw forbidden('bad_origin');
  }
}

export async function readJson<S extends ZodTypeAny>(req: NextRequest, schema: S): Promise<z.output<S>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw badRequest('invalid_json');
  }
  return schema.parse(body);
}

export function query(req: NextRequest) {
  return req.nextUrl.searchParams;
}

export function clientIp(req: NextRequest) {
  return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'local';
}

// ---------- In-memory fixed-window rate limiter (per server instance) ----------
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      buckets.forEach((v, k) => {
        if (v.resetAt < now) buckets.delete(k);
      });
    }
    return;
  }
  b.count += 1;
  if (b.count > limit) throw tooMany();
}

export function resetRateLimits() {
  buckets.clear();
}

export function withSessionCookie(res: NextResponse, token: string | null, expires?: Date) {
  const secure = process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false';
  res.cookies.set('ks_session', token || '', {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    expires: token ? expires : new Date(0),
  });
  return res;
}
