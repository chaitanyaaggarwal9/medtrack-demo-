import type { Config } from '@netlify/functions';
import { pingDb } from '../lib/db.ts';

// GET /api/health: is the API up, which environment is it, and can it
// reach the database (true/false only, never error details).
// It returns no user or health data.
export default async (): Promise<Response> => {
  return Response.json({
    status: 'ok',
    env: process.env.APP_ENV || 'local',
    db: await pingDb(),
  });
};

export const config: Config = {
  path: '/api/health',
};
