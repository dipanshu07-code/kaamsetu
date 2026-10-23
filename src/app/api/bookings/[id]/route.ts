import { requireActor } from '@/server/auth';
import { getBooking } from '@/server/services/bookings';
import { route } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor, params }) => ({ booking: await getBooking(db, requireActor(actor), params.id) }));
