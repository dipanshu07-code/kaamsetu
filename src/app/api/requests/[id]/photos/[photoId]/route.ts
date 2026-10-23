import { NextResponse } from 'next/server';
import { requireActor } from '@/server/auth';
import { getRequestPhoto } from '@/server/services/requests';
import { route } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor, params }) => {
  const photo = await getRequestPhoto(db, requireActor(actor), params.id, params.photoId);
  return new NextResponse(new Uint8Array(photo.data), {
    headers: {
      'Content-Type': photo.mime,
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  });
});
