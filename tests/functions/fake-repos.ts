import type { DoseLogDto, MedicineDto } from '../../src/lib/api-types.ts';
import type { DoseLogRepo, MedicineRepo } from '../../netlify/lib/repo.ts';

/**
 * In-memory stand-ins for the database, with the SAME ownership rule as the
 * real repos: another user's row behaves like a row that does not exist.
 */
export const USER_A = 'a0000000-0000-4000-8000-000000000001';
export const USER_B = 'a0000000-0000-4000-8000-000000000002';
export const MED_A = 'b0000000-0000-4000-8000-000000000001';
export const MED_B = 'b0000000-0000-4000-8000-000000000005';
export const LOG_B = 'c0000000-0000-4000-8000-000000000009';

type Owned<T> = T & { userId: string };

export function createFakeRepos() {
  let next = 100;
  const newId = (prefix: string) =>
    `${prefix}0000000-0000-4000-8000-${String(next++).padStart(12, '0')}`;

  const meds: Owned<MedicineDto>[] = [
    {
      id: MED_A,
      userId: USER_A,
      name: 'Medicine A',
      doseText: '5 ml',
      times: ['08:00'],
    },
    {
      id: MED_B,
      userId: USER_B,
      name: 'Medicine E',
      doseText: '1 tablet',
      times: ['07:30'],
    },
  ];
  const logs: Owned<DoseLogDto>[] = [
    {
      id: LOG_B,
      userId: USER_B,
      medicineId: MED_B,
      doseDate: '2026-11-21',
      scheduledTime: '07:30',
      takenAt: '2026-11-21T07:31:00.000Z',
    },
  ];
  const strip = <T extends { userId: string }>(row: T): Omit<T, 'userId'> => {
    const copy: Partial<T> = { ...row };
    delete copy.userId;
    return copy as Omit<T, 'userId'>;
  };
  const mine = (userId: string, id: string) =>
    meds.find((m) => m.id === id && m.userId === userId);

  const medicineRepo: MedicineRepo = {
    async list(userId) {
      return meds.filter((m) => m.userId === userId).map(strip);
    },
    async get(userId, id) {
      const m = mine(userId, id);
      return m ? strip(m) : null;
    },
    async create(userId, input) {
      const m = {
        id: newId('b'),
        userId,
        ...input,
        times: [...input.times].sort(),
      };
      meds.push(m);
      return strip(m);
    },
    async update(userId, id, patch) {
      const m = mine(userId, id);
      if (!m) return null;
      Object.assign(m, patch);
      return strip(m);
    },
    async remove(userId, id) {
      const i = meds.findIndex((m) => m.id === id && m.userId === userId);
      if (i < 0) return false;
      meds.splice(i, 1);
      return true;
    },
  };

  const doseLogRepo: DoseLogRepo = {
    async listForDay(userId, doseDate) {
      return logs
        .filter((l) => l.userId === userId && l.doseDate === doseDate)
        .map(strip);
    },
    async tick(userId, input) {
      const m = mine(userId, input.medicineId);
      if (!m) return { ok: false, reason: 'medicine_not_found' };
      if (!m.times.includes(input.scheduledTime))
        return { ok: false, reason: 'time_not_planned' };
      const dup = logs.some(
        (l) =>
          l.medicineId === input.medicineId &&
          l.doseDate === input.doseDate &&
          l.scheduledTime === input.scheduledTime,
      );
      if (dup) return { ok: false, reason: 'already_ticked' };
      const log = {
        id: newId('c'),
        userId,
        ...input,
        takenAt: new Date().toISOString(),
      };
      logs.push(log);
      return { ok: true, log: strip(log) };
    },
    async remove(userId, id) {
      const i = logs.findIndex((l) => l.id === id && l.userId === userId);
      if (i < 0) return false;
      logs.splice(i, 1);
      return true;
    },
  };

  return { medicineRepo, doseLogRepo, meds, logs };
}

/** A response body, typed loosely for tests. */
export type Body = {
  error: string;
  fields: Record<string, string>;
  id: string;
  name: string;
  times: string[];
} & Record<string, unknown>;
export const readBody = async (res: Response) => (await res.json()) as Body;
