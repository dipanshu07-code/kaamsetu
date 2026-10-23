import { requireActor } from '@/server/auth';
import { withdrawApplication } from '@/server/services/jobs';
import { route } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = route(async ({ db, actor, params }) => {
  await withdrawApplication(db, requireActor(actor, ['worker']), params.id);
  return { ok: true };
});
