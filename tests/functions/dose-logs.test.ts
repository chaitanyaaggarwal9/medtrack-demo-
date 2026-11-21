// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { config } from '../../netlify/functions/dose-logs.ts';
import { createDoseLogsHandler } from '../../netlify/lib/handlers.ts';
import {
  createFakeRepos,
  LOG_B,
  MED_A,
  MED_B,
  USER_A,
  readBody,
} from './fake-repos.ts';

type Params = { id?: string };
const BASE = 'http://localhost/api/dose-logs';

function setup() {
  const fake = createFakeRepos();
  const handler = createDoseLogsHandler({
    getUserId: () => USER_A,
    repo: fake.doseLogRepo,
  });
  const call = (
    method: string,
    opts: { params?: Params; query?: string; body?: unknown } = {},
  ) =>
    handler(
      new Request(
        `${BASE}${opts.params?.id ? `/${opts.params.id}` : ''}${opts.query ?? ''}`,
        {
          method,
          ...(opts.body === undefined
            ? {}
            : { body: JSON.stringify(opts.body) }),
        },
      ),
    );
  return { fake, call };
}

const tick = {
  medicineId: MED_A,
  doseDate: '2026-11-21',
  scheduledTime: '08:00',
};

describe('/api/dose-logs', () => {
  it('is routed at /api/dose-logs and /api/dose-logs/:id', () => {
    expect(config.path).toEqual(['/api/dose-logs', '/api/dose-logs/:id']);
  });

  it('GET needs a valid ?date: 400 without it', async () => {
    const { call } = setup();
    expect((await call('GET')).status).toBe(400);
    expect((await call('GET', { query: '?date=yesterday' })).status).toBe(400);
  });

  it("GET lists only my ticks for that day (not user B's)", async () => {
    const { call } = setup();
    const res = await call('GET', { query: '?date=2026-11-21' });
    expect(res.status).toBe(200);
    expect(await readBody(res)).toEqual([]);
  });

  it('POST ticks a planned dose: 201, then 409 for the same dose again', async () => {
    const { call } = setup();
    const res = await call('POST', { body: tick });
    expect(res.status).toBe(201);
    expect(await readBody(res)).toMatchObject(tick);
    expect((await call('POST', { body: tick })).status).toBe(409);
  });

  it('POST for a time that is not planned: 400', async () => {
    const { call } = setup();
    const res = await call('POST', {
      body: { ...tick, scheduledTime: '09:00' },
    });
    expect(res.status).toBe(400);
    expect((await readBody(res)).fields).toHaveProperty('scheduledTime');
  });

  it("POST against another user's medicine: 404, nothing saved", async () => {
    const { call, fake } = setup();
    const before = fake.logs.length;
    const res = await call('POST', {
      body: { ...tick, medicineId: MED_B, scheduledTime: '07:30' },
    });
    expect(res.status).toBe(404);
    expect(fake.logs).toHaveLength(before);
  });

  it('POST with bad input: 400', async () => {
    const { call } = setup();
    expect(
      (await call('POST', { body: { ...tick, doseDate: '21/11/2026' } }))
        .status,
    ).toBe(400);
    expect(
      (await call('POST', { body: { ...tick, medicineId: 'abc' } })).status,
    ).toBe(400);
  });

  it('DELETE undoes my tick: 204', async () => {
    const { call } = setup();
    const created = await readBody(await call('POST', { body: tick }));
    expect((await call('DELETE', { params: { id: created.id } })).status).toBe(
      204,
    );
    expect((await call('DELETE', { params: { id: created.id } })).status).toBe(
      404,
    );
  });

  it("DELETE of another user's tick: 404, and it is not deleted", async () => {
    const { call, fake } = setup();
    expect((await call('DELETE', { params: { id: LOG_B } })).status).toBe(404);
    expect(fake.logs.some((l) => l.id === LOG_B)).toBe(true);
  });

  it('wrong method: 405', async () => {
    const { call } = setup();
    expect((await call('PATCH')).status).toBe(405);
    expect((await call('GET', { params: { id: LOG_B } })).status).toBe(405);
  });
});
