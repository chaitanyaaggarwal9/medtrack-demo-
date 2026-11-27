// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import health, { config } from '../../netlify/functions/health.ts';
import { pingDb } from '../../netlify/lib/db.ts';

vi.mock('../../netlify/lib/db.ts', () => ({
  pingDb: vi.fn(async () => false),
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('GET /api/health', () => {
  it('is routed at /api/health', () => {
    expect(config.path).toBe('/api/health');
  });

  it('returns JSON with status ok, the APP_ENV and db reachability', async () => {
    vi.stubEnv('APP_ENV', 'staging');
    vi.mocked(pingDb).mockResolvedValueOnce(true);
    const res = await health();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
    expect(await res.json()).toEqual({
      status: 'ok',
      env: 'staging',
      db: true,
    });
  });

  it('reports db: false (and nothing else) when the database is not reachable', async () => {
    vi.stubEnv('APP_ENV', 'development');
    vi.mocked(pingDb).mockResolvedValueOnce(false);
    const res = await health();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      status: 'ok',
      env: 'development',
      db: false,
    });
  });

  it('falls back to "local" when APP_ENV is empty', async () => {
    vi.stubEnv('APP_ENV', '');
    const res = await health();
    expect((await res.json()) as unknown).toMatchObject({ env: 'local' });
  });

  it('falls back to "local" when APP_ENV is not set', async () => {
    vi.stubEnv('APP_ENV', undefined);
    const res = await health();
    expect(await res.json()).toEqual({ status: 'ok', env: 'local', db: false });
  });
});
