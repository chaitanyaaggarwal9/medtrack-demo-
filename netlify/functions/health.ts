import type { Config } from '@netlify/functions';

// GET /api/health: a tiny check that the API is up and which environment
// it runs in. It returns no user or health data.
export default async (): Promise<Response> => {
  return Response.json({
    status: 'ok',
    env: process.env.APP_ENV ?? 'local',
  });
};

export const config: Config = {
  path: '/api/health',
};
