import { z } from 'zod';
import { requireActor } from '@/server/auth';
import { setBlock } from '@/server/services/chat';
import { route, readJson } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = route(async ({ db, actor, params, req }) => {
  const { block } = await readJson(req, z.object({ block: z.boolean() }));
  await setBlock(db, requireActor(actor), params.id, block);
  return { ok: true };
});
