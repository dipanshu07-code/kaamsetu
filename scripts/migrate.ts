/**
 * Applies supabase/migrations to the configured database.
 *   DATABASE_URL=postgres://... npm run db:migrate   (Supabase / Postgres)
 *   npm run db:migrate                               (local PGlite in .data/pglite)
 */
import { getDb, runMigrations } from '../src/server/db';

async function main() {
  process.env.KAAMSETU_DEMO_SEED = process.env.KAAMSETU_DEMO_SEED || 'false';
  const db = await getDb();
  await runMigrations(db, (m) => console.log(m));
  console.log(`Migrations complete (${db.kind}).`);
  await db.close();
}

main().catch((e) => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});
