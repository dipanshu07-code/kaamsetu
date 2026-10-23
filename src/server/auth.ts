import crypto from 'crypto';
import { Queryable } from './db';
import { forbidden, unauthorized } from './errors';
import type { UserRole } from '@/types';

export const SESSION_COOKIE = 'ks_session';
export const SESSION_DAYS = 30;

export interface Actor {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  language: 'en' | 'hi';
  workerId: string | null;
}

// ---------- Passwords (scrypt, per-user salt) ----------
const SCRYPT_N = 16384;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64, { N: SCRYPT_N });
  return `scrypt$${SCRYPT_N}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [scheme, n, saltB64, hashB64] = stored.split('$');
  if (scheme !== 'scrypt') return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = crypto.scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, { N: Number(n) });
  return crypto.timingSafeEqual(expected, actual);
}

// ---------- Sessions (random token in an httpOnly cookie, hash in DB) ----------
const sha256 = (v: string) => crypto.createHash('sha256').update(v).digest('hex');

export async function createSession(q: Queryable, userId: string): Promise<{ token: string; expires: Date }> {
  const token = crypto.randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await q.query('INSERT INTO user_sessions(user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [
    userId,
    sha256(token),
    expires,
  ]);
  return { token, expires };
}

export async function destroySession(q: Queryable, token: string) {
  await q.query('DELETE FROM user_sessions WHERE token_hash = $1', [sha256(token)]);
}

export async function actorFromToken(q: Queryable, token: string | undefined | null): Promise<Actor | null> {
  if (!token || token.length > 100) return null;
  const { rows } = await q.query(
    `SELECT u.id, u.role, u.full_name, u.phone, u.preferred_language, wp.id AS worker_id
       FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN worker_profiles wp ON wp.user_id = u.id
      WHERE s.token_hash = $1 AND s.expires_at > NOW()
        AND u.is_active AND NOT u.is_suspended AND u.deleted_at IS NULL`,
    [sha256(token)],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    role: r.role,
    name: r.full_name,
    phone: r.phone,
    language: r.preferred_language,
    workerId: r.worker_id,
  };
}

export function requireActor(actor: Actor | null, roles?: UserRole[]): Actor {
  if (!actor) throw unauthorized();
  if (roles && !roles.includes(actor.role)) throw forbidden('wrong_role');
  return actor;
}

export function requireWorker(actor: Actor | null): Actor & { workerId: string } {
  const a = requireActor(actor, ['worker']);
  if (!a.workerId) throw forbidden('worker_profile_missing');
  return a as Actor & { workerId: string };
}
