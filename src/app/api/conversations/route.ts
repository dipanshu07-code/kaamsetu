import { requireActor } from '@/server/auth';
import { listConversations } from '@/server/services/chat';
import { route } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor }) => ({ conversations: await listConversations(db, requireActor(actor)) }));
