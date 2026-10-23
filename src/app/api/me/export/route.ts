import { NextResponse } from 'next/server';
import { requireActor } from '@/server/auth';
import { exportMyData } from '@/server/services/accounts';
import { route, rateLimit } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor }) => {
  const a = requireActor(actor);
  rateLimit(`export:${a.id}`, 5, 3600_000);
  const data = await exportMyData(db, a);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="kaamsetu-my-data.json"',
      'Cache-Control': 'no-store',
    },
  });
});
