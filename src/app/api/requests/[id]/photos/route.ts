import { requireActor } from '@/server/auth';
import { badRequest } from '@/server/errors';
import { addRequestPhoto, listRequestPhotoIds } from '@/server/services/requests';
import { route, rateLimit } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor, params }) => ({ photoIds: await listRequestPhotoIds(db, requireActor(actor), params.id) }));

export const POST = route(async ({ db, actor, req, params }) => {
  const a = requireActor(actor, ['customer']);
  rateLimit(`photo:${a.id}`, 20, 3600_000);
  const len = Number(req.headers.get('content-length') || 0);
  if (len > 2.5 * 1024 * 1024) throw badRequest('photo_too_large');
  const form = await req.formData();
  const file = form.get('photo');
  if (!file || typeof file === 'string') throw badRequest('photo_missing');
  return addRequestPhoto(db, a, params.id, Buffer.from(await file.arrayBuffer()));
});
