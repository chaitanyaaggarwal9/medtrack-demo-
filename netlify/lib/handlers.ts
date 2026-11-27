import {
  dateSchema,
  doseLogInputSchema,
  idSchema,
  medicineInputSchema,
  medicineUpdateSchema,
} from '../../src/lib/validation.ts';
import {
  HttpError,
  methodNotAllowed,
  parseOr400,
  readJson,
  withErrors,
} from './http.ts';
import type { DoseLogRepo, MedicineRepo } from './repo.ts';

/**
 * The API logic, separate from Netlify and the database so it can be tested
 * with fake repos. `getUserId` is the only way to learn who is asking.
 */
type Deps<R> = { getUserId: () => string; repo: R };

const NOT_FOUND = 'We could not find that medicine.';
const NOT_FOUND_TICK = 'We could not find that tick.';

/**
 * Reads the id from the address itself. Only `<base>` (no id) and
 * `<base>/<uuid>` are accepted; anything else (a bad id, "…/x.html",
 * "…/x/index.html") is a 404. So "not a real id", "does not exist" and
 * "belongs to someone else" all look the same from outside.
 */
function idFromPath(
  req: Request,
  base: string,
  notFound: string,
): string | undefined {
  const path = new URL(req.url).pathname.replace(/\/+$/, '');
  if (path === base) return undefined;
  const rest = path.startsWith(`${base}/`) ? path.slice(base.length + 1) : '';
  const result = idSchema.safeParse(rest);
  if (!result.success) throw new HttpError(404, notFound);
  return result.data;
}

/** /api/medicines and /api/medicines/:id */
export function createMedicinesHandler({
  getUserId,
  repo,
}: Deps<MedicineRepo>) {
  return withErrors(async (req: Request) => {
    const userId = getUserId();
    const id = idFromPath(req, '/api/medicines', NOT_FOUND);

    if (id === undefined) {
      if (req.method === 'GET') return Response.json(await repo.list(userId));
      if (req.method === 'POST') {
        const input = parseOr400(medicineInputSchema, await readJson(req));
        return Response.json(await repo.create(userId, input), { status: 201 });
      }
      return methodNotAllowed(['GET', 'POST']);
    }

    if (req.method === 'GET') {
      const medicine = await repo.get(userId, id);
      if (!medicine) throw new HttpError(404, NOT_FOUND);
      return Response.json(medicine);
    }
    if (req.method === 'PATCH') {
      const patch = parseOr400(medicineUpdateSchema, await readJson(req));
      const medicine = await repo.update(userId, id, patch);
      if (!medicine) throw new HttpError(404, NOT_FOUND);
      return Response.json(medicine);
    }
    if (req.method === 'DELETE') {
      if (!(await repo.remove(userId, id))) throw new HttpError(404, NOT_FOUND);
      return new Response(null, { status: 204 });
    }
    return methodNotAllowed(['GET', 'PATCH', 'DELETE']);
  });
}

/** /api/dose-logs and /api/dose-logs/:id */
export function createDoseLogsHandler({ getUserId, repo }: Deps<DoseLogRepo>) {
  return withErrors(async (req: Request) => {
    const userId = getUserId();
    const id = idFromPath(req, '/api/dose-logs', NOT_FOUND_TICK);

    if (id === undefined) {
      if (req.method === 'GET') {
        const date = new URL(req.url).searchParams.get('date');
        const doseDate = parseOr400(dateSchema, date ?? '');
        return Response.json(await repo.listForDay(userId, doseDate));
      }
      if (req.method === 'POST') {
        const input = parseOr400(doseLogInputSchema, await readJson(req));
        const result = await repo.tick(userId, input);
        if (result.ok) return Response.json(result.log, { status: 201 });
        if (result.reason === 'medicine_not_found')
          throw new HttpError(404, NOT_FOUND);
        if (result.reason === 'time_not_planned') {
          throw new HttpError(
            400,
            'That time is not planned for this medicine.',
            {
              scheduledTime: 'That time is not planned for this medicine.',
            },
          );
        }
        throw new HttpError(409, 'This dose is already ticked for that day.');
      }
      return methodNotAllowed(['GET', 'POST']);
    }

    if (req.method === 'DELETE') {
      if (!(await repo.remove(userId, id))) {
        throw new HttpError(404, NOT_FOUND_TICK);
      }
      return new Response(null, { status: 204 });
    }
    return methodNotAllowed(['DELETE']);
  });
}
