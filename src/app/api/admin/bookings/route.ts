import { requireActor } from '@/server/auth';
import { adminListBookings } from '@/server/services/admin';
import { route } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor }) => ({ bookings: await adminListBookings(db, requireActor(actor, ['admin'])) }));
