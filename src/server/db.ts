import fs from 'fs';
import path from 'path';

/**
 * Database access for the KaamSetu server.
 *
 * - Production: set DATABASE_URL (e.g. the Supabase Postgres connection string).
 *   Queries go through a `pg` connection pool.
 * - Local development / tests: when DATABASE_URL is not set, an embedded
 *   PostgreSQL (PGlite) is used, persisted in KAAMSETU_PGLITE_DIR (default
 *   `.data/pglite`), or in memory when KAAMSETU_PGLITE_DIR=memory.
 *
 * Both run the same SQL migrations from supabase/migrations.
 */

export interface Queryable {
  query<T = any>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
  /** Runs a multi-statement SQL script (no parameters). */
  exec(sql: string): Promise<void>;
}

export interface Db extends Queryable {
  transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T>;
  kind: 'pg' | 'pglite';
  close(): Promise<void>;
}

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');
const LEGACY_MIGRATIONS = [
  '20261018000001_kaamsetu_schema.sql',
  '20261018000002_rls_policies.sql',
  '20261018000003_seed_data.sql',
];

async function createPgDb(url: string): Promise<Db> {
  const { Pool, types } = await import('pg');
  // Return NUMERIC as JS numbers (amounts are well within float precision).
  types.setTypeParser(1700, (v: string) => parseFloat(v));
  const pool = new Pool({
    connectionString: url,
    max: Number(process.env.DATABASE_POOL_MAX || 10),
    ssl: process.env.DATABASE_SSL === 'false' ? undefined : { rejectUnauthorized: false },
  });
  return {
    kind: 'pg',
    query: (sql, params) => pool.query(sql, params as any[]) as any,
    exec: async (sql) => {
      await pool.query(sql);
    },
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn({
          query: (s, p) => client.query(s, p as any[]) as any,
          exec: async (s) => {
            await client.query(s);
          },
        });
        await client.query('COMMIT');
        return result;
      } catch (e) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw e;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}

async function createPgliteDb(dir: string): Promise<Db> {
  const { PGlite, types } = await import('@electric-sql/pglite');
  const { btree_gist } = await import('@electric-sql/pglite/contrib/btree_gist');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  if (dir !== 'memory') fs.mkdirSync(dir, { recursive: true });
  const pg = new PGlite({
    dataDir: dir === 'memory' ? undefined : dir,
    extensions: { btree_gist, uuid_ossp },
    parsers: { [types.NUMERIC]: (v: string) => parseFloat(v) },
  });
  await pg.waitReady;
  // PGlite is single-connection: serialise transactions so that a plain query
  // never interleaves with another caller's open transaction.
  let chain: Promise<unknown> = Promise.resolve();
  const serial = <T>(fn: () => Promise<T>): Promise<T> => {
    const run = chain.then(fn, fn);
    chain = run.catch(() => undefined);
    return run;
  };
  return {
    kind: 'pglite',
    query: (sql, params) => serial(() => pg.query(sql, params as any[]) as any),
    exec: (sql) => serial(async () => {
      await pg.exec(sql);
    }),
    transaction: (fn) =>
      serial(() =>
        pg.transaction((tx) =>
          fn({
            query: (s, p) => tx.query(s, p as any[]) as any,
            exec: async (s) => {
              await tx.exec(s);
            },
          }),
        ),
      ),
    close: () => pg.close(),
  };
}

/** Objects that exist on Supabase but not on plain Postgres. */
async function ensureSupabaseShims(db: Db) {
  await db.exec(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        CREATE SCHEMA auth;
        CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
          'SELECT NULLIF(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
      END IF;
    END $$;`);
}

export async function runMigrations(db: Db, log: (msg: string) => void = () => undefined) {
  await ensureSupabaseShims(db);
  await db.query(`CREATE TABLE IF NOT EXISTS public.schema_migrations (
      name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT NOW())`);
  const applied = new Set(
    (await db.query<{ name: string }>('SELECT name FROM public.schema_migrations')).rows.map((r) => r.name),
  );
  // Databases set up by pasting the original SQL files into the Supabase SQL
  // editor have the tables but no migration history: baseline them.
  if (applied.size === 0) {
    const { rows } = await db.query(`SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='users'`);
    if (rows.length) {
      for (const name of LEGACY_MIGRATIONS) {
        await db.query('INSERT INTO public.schema_migrations(name) VALUES ($1) ON CONFLICT DO NOTHING', [name]);
        applied.add(name);
      }
      log('Existing schema detected: original migrations marked as applied.');
    }
  }
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    await db.transaction(async (tx) => {
      await tx.exec(sql);
      await tx.query('INSERT INTO public.schema_migrations(name) VALUES ($1)', [file]);
    });
    log(`Applied ${file}`);
  }
}

type GlobalWithDb = typeof globalThis & { __kaamsetuDb?: Promise<Db> };

async function init(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  const db = url
    ? await createPgDb(url)
    : await createPgliteDb(process.env.KAAMSETU_PGLITE_DIR || path.join(process.cwd(), '.data', 'pglite'));
  const autoMigrate = db.kind === 'pglite' || process.env.KAAMSETU_AUTO_MIGRATE === 'true';
  if (autoMigrate) await runMigrations(db);
  if (isDemoMode()) {
    if (process.env.NODE_ENV === 'production' && db.kind === 'pg') {
      console.warn('[kaamsetu] WARNING: demo accounts with a shared password are being seeded into a production database.');
    }
    const { seedDemoData } = await import('./seed');
    await seedDemoData(db);
  }
  return db;
}

/** Demo data (clearly labelled) is seeded only when explicitly enabled or in local PGlite mode. */
export function isDemoMode(): boolean {
  const flag = process.env.KAAMSETU_DEMO_SEED;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return !process.env.DATABASE_URL;
}

export function getDb(): Promise<Db> {
  const g = globalThis as GlobalWithDb;
  if (!g.__kaamsetuDb) {
    g.__kaamsetuDb = init().catch((e) => {
      g.__kaamsetuDb = undefined;
      throw e;
    });
  }
  return g.__kaamsetuDb;
}

/** Test helper: replace the shared database instance. */
export function setDbForTests(db: Promise<Db> | undefined) {
  (globalThis as GlobalWithDb).__kaamsetuDb = db;
}

export { createPgliteDb };
