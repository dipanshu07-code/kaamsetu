import { requireActor } from '@/server/auth';
import { adminListChecks, REVIEW_METHODS, providerStatus } from '@/server/services/verification';
import { route, query } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor, req }) => ({
  checks: await adminListChecks(db, requireActor(actor, ['admin']), query(req).get('status') || 'pending'),
  methods: REVIEW_METHODS,
  provider: providerStatus(),
}));
