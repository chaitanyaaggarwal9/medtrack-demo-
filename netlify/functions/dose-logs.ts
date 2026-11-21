import type { Config } from '@netlify/functions';
import { getCurrentUserId } from '../lib/current-user.ts';
import { getDb } from '../lib/db.ts';
import { createDoseLogsHandler } from '../lib/handlers.ts';
import { createDoseLogRepo, createMedicineRepo } from '../lib/repo.ts';

// GET /api/dose-logs?date=YYYY-MM-DD, POST /api/dose-logs (tick),
// DELETE /api/dose-logs/:id (undo). Only the signed-in user's ticks.
const handler = createDoseLogsHandler({
  getUserId: getCurrentUserId,
  repo: createDoseLogRepo(getDb, createMedicineRepo(getDb)),
});

export default (req: Request) => handler(req);

export const config: Config = {
  path: ['/api/dose-logs', '/api/dose-logs/:id'],
};
