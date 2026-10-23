/**
 * Creates (or promotes) an administrator account. Admins cannot self-register.
 *
 *   ADMIN_PHONE=98xxxxxxxx ADMIN_NAME="Ops Lead" ADMIN_PASSWORD='long-random-password' npm run create-admin
 *
 * Uses DATABASE_URL when set, otherwise the local PGlite database.
 */
import { getDb } from '../src/server/db';
import { hashPassword } from '../src/server/auth';

async function main() {
  process.env.KAAMSETU_DEMO_SEED = process.env.KAAMSETU_DEMO_SEED || 'false';
  const phone = (process.env.ADMIN_PHONE || '').replace(/\D/g, '').slice(-10);
  const name = (process.env.ADMIN_NAME || '').trim();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!/^[6-9]\d{9}$/.test(phone) || name.length < 2 || password.length < 12) {
    throw new Error('Set ADMIN_PHONE (10-digit Indian mobile), ADMIN_NAME and ADMIN_PASSWORD (12+ characters).');
  }
  const db = await getDb();
  await db.query(
    `INSERT INTO users(phone, full_name, role, password_hash, privacy_accepted_at)
     VALUES ($1, $2, 'admin', $3, NOW())
     ON CONFLICT (phone) DO UPDATE SET role = 'admin', full_name = EXCLUDED.full_name, password_hash = EXCLUDED.password_hash`,
    [phone, name, hashPassword(password)],
  );
  console.log(`Admin account ready for ${phone.slice(0, 2)}******${phone.slice(-2)}.`);
  await db.close();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
