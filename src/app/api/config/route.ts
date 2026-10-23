import { isDemoMode } from '@/server/db';
import { providerStatus } from '@/server/services/verification';
import { DEMO_PHONES, demoPassword } from '@/server/seed';
import { route } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db }) => {
  const demo = isDemoMode();
  return {
    demoMode: demo,
    database: db.kind,
    demoAccounts: demo ? DEMO_PHONES : null,
    // Demo accounts only exist in demo mode; their shared password is not a secret there.
    demoPassword: demo ? demoPassword() : null,
    verificationProvider: providerStatus(),
    smsOtpConfigured: false,
    realtime: 'polling',
  };
});
