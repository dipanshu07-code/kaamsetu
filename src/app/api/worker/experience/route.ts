import { requireWorker } from '@/server/auth';
import { addExperience, experienceSchema } from '@/server/services/workers';
import { route, readJson } from '@/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = route(async ({ db, actor, req }) => addExperience(db, requireWorker(actor), await readJson(req, experienceSchema)));
