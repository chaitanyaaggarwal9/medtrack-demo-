import type { Config } from '@netlify/functions';
import { getCurrentUserId } from '../lib/current-user.ts';
import { getDb } from '../lib/db.ts';
import { createMedicinesHandler } from '../lib/handlers.ts';
import { createMedicineRepo } from '../lib/repo.ts';

// GET/POST /api/medicines, GET/PATCH/DELETE /api/medicines/:id
// Only ever returns the signed-in (for now: demo) user's medicines.
const handler = createMedicinesHandler({
  getUserId: getCurrentUserId,
  repo: createMedicineRepo(getDb),
});

export default (req: Request) => handler(req);

export const config: Config = {
  path: ['/api/medicines', '/api/medicines/:id'],
};
