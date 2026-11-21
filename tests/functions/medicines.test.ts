// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { config } from '../../netlify/functions/medicines.ts';
import { createMedicinesHandler } from '../../netlify/lib/handlers.ts';
import { HttpError } from '../../netlify/lib/http.ts';
import {
  createFakeRepos,
  MED_A,
  MED_B,
  USER_A,
  readBody,
} from './fake-repos.ts';

type Params = { id?: string };
const BASE = 'http://localhost/api/medicines';

function setup(getUserId: () => string = () => USER_A) {
  const fake = createFakeRepos();
  const handler = createMedicinesHandler({
    getUserId,
    repo: fake.medicineRepo,
  });
  const call = (method: string, params: Params = {}, body?: unknown) =>
    handler(
      new Request(params.id ? `${BASE}/${params.id}` : BASE, {
        method,
        ...(body === undefined
          ? {}
          : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
      }),
    );
  return { fake, call };
}

const newMedicine = {
  name: 'Medicine Z',
  doseText: '1 tablet',
  times: ['20:00', '08:00'],
};

describe('/api/medicines', () => {
  it('is routed at /api/medicines and /api/medicines/:id', () => {
    expect(config.path).toEqual(['/api/medicines', '/api/medicines/:id']);
  });

  it('GET lists only my medicines, without user ids', async () => {
    const { call } = setup();
    const res = await call('GET');
    expect(res.status).toBe(200);
    const body = await readBody(res);
    expect(body).toEqual([
      { id: MED_A, name: 'Medicine A', doseText: '5 ml', times: ['08:00'] },
    ]);
    expect(JSON.stringify(body)).not.toContain('userId');
  });

  it('POST creates a medicine for me: 201', async () => {
    const { call, fake } = setup();
    const res = await call('POST', {}, newMedicine);
    expect(res.status).toBe(201);
    expect(await readBody(res)).toMatchObject({
      name: 'Medicine Z',
      times: ['08:00', '20:00'],
    });
    expect(fake.meds.at(-1)?.userId).toBe(USER_A);
  });

  it('POST with a userId in the body is rejected (400): the server decides the user', async () => {
    const { call, fake } = setup();
    const before = fake.meds.length;
    const res = await call('POST', {}, { ...newMedicine, userId: 'someone' });
    expect(res.status).toBe(400);
    expect(fake.meds).toHaveLength(before);
  });

  it('POST with bad input: 400 with a message for each field', async () => {
    const { call } = setup();
    const res = await call(
      'POST',
      {},
      { name: '', doseText: '1', times: ['25:00'] },
    );
    expect(res.status).toBe(400);
    const body = await readBody(res);
    expect(body.error).toBe('Please check the highlighted fields.');
    expect(Object.keys(body.fields).sort()).toEqual(['name', 'times']);
  });

  it('POST with broken JSON or no body: 400', async () => {
    const { call } = setup();
    expect((await call('POST', {}, '{not json')).status).toBe(400);
    expect((await call('POST', {}, '')).status).toBe(400);
  });

  it('POST with a huge body: 413', async () => {
    const { call } = setup();
    const res = await call(
      'POST',
      {},
      { ...newMedicine, name: 'x'.repeat(20_000) },
    );
    expect(res.status).toBe(413);
  });

  it('GET /:id returns my medicine', async () => {
    const { call } = setup();
    const res = await call('GET', { id: MED_A });
    expect(res.status).toBe(200);
    expect((await readBody(res)).name).toBe('Medicine A');
  });

  it('PATCH /:id updates my medicine', async () => {
    const { call } = setup();
    const res = await call('PATCH', { id: MED_A }, { times: ['09:00'] });
    expect(res.status).toBe(200);
    expect((await readBody(res)).times).toEqual(['09:00']);
  });

  it('PATCH with nothing to change: 400', async () => {
    const { call } = setup();
    expect((await call('PATCH', { id: MED_A }, {})).status).toBe(400);
  });

  it('DELETE /:id deletes my medicine: 204, then 404', async () => {
    const { call } = setup();
    const res = await call('DELETE', { id: MED_A });
    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');
    expect((await call('DELETE', { id: MED_A })).status).toBe(404);
  });

  it("another user's medicine looks like it does not exist: 404 for GET, PATCH, DELETE", async () => {
    const { call, fake } = setup();
    expect((await call('GET', { id: MED_B })).status).toBe(404);
    expect(
      (await call('PATCH', { id: MED_B }, { name: 'Hacked' })).status,
    ).toBe(404);
    expect((await call('DELETE', { id: MED_B })).status).toBe(404);
    // User B's medicine is untouched.
    expect(fake.meds.find((m) => m.id === MED_B)?.name).toBe('Medicine E');
  });

  it('an id that is not a uuid looks like one that does not exist: 404', async () => {
    const { call } = setup();
    expect((await call('GET', { id: '1' })).status).toBe(404);
    expect((await call('DELETE', { id: "1' OR 1=1" })).status).toBe(404);
    // netlify dev retries 404s as ".html", ".htm" and "/index.html":
    // every one must still be a 404 (never the list).
    for (const tail of ['.html', '.htm', '/index.html']) {
      expect((await call('GET', { id: `${MED_B}${tail}` })).status).toBe(404);
      expect((await call('DELETE', { id: `${MED_A}${tail}` })).status).toBe(
        404,
      );
    }
  });

  it('a method that is not allowed: 405 with an Allow header', async () => {
    const { call } = setup();
    const res = await call('PUT');
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('GET, POST');
    expect((await call('POST', { id: MED_A }, newMedicine)).status).toBe(405);
  });

  it('fails closed with a friendly 500 when the user is not set up', async () => {
    const { call } = setup(() => {
      throw new HttpError(
        500,
        'The app is not set up yet. Please try again later.',
      );
    });
    const res = await call('GET');
    expect(res.status).toBe(500);
    expect((await readBody(res)).error).toBe(
      'The app is not set up yet. Please try again later.',
    );
  });

  it('an unexpected error becomes a friendly 500 with no details', async () => {
    const fake = createFakeRepos();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const handler = createMedicinesHandler({
      getUserId: () => USER_A,
      repo: {
        ...fake.medicineRepo,
        list: async () => {
          throw new Error('connect failed: postgres://user:secret@host/db');
        },
      },
    });
    const res = await handler(new Request(BASE));
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).not.toContain('secret');
    expect(text).toContain('Something went wrong');
    // Only the error's name is logged, never its message.
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain('secret');
    errorSpy.mockRestore();
  });
});
