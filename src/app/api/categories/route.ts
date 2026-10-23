import { listCategories } from '@/server/services/accounts';
import { route, query } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route(async ({ db, actor, req }) => ({
  categories: await listCategories(db, query(req).get('all') === '1' && actor?.role === 'admin'),
}));
