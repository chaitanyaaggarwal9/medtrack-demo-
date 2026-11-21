// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import health, { config } from '../../netlify/functions/health.ts';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('GET /api/health', () => {
  it('is routed at /api/health', () => {
    expect(config.path).toBe('/api/health');
  });

  it('returns JSON with status ok and the APP_ENV', async () => {
    vi.stubEnv('APP_ENV', 'staging');
    const res = await health();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
    expect(await res.json()).toEqual({ status: 'ok', env: 'staging' });
  });

  it('falls back to "local" when APP_ENV is not set', async () => {
    vi.stubEnv('APP_ENV', undefined);
    const res = await health();
    expect(await res.json()).toEqual({ status: 'ok', env: 'local' });
  });
});
