import { and, asc, eq, sql } from 'drizzle-orm';
import { doseLogs, medicines } from '../../src/db/schema.ts';
import type { DoseLogDto, MedicineDto } from '../../src/lib/api-types.ts';
import type {
  DoseLogInput,
  MedicineInput,
  MedicineUpdate,
} from '../../src/lib/validation.ts';
import type { Db } from './db.ts';

/**
 * Every function takes the signed-in userId and EVERY query filters by it.
 * Another user's row behaves exactly like a row that does not exist.
 */
export type MedicineRepo = {
  list(userId: string): Promise<MedicineDto[]>;
  get(userId: string, id: string): Promise<MedicineDto | null>;
  create(userId: string, input: MedicineInput): Promise<MedicineDto>;
  update(
    userId: string,
    id: string,
    patch: MedicineUpdate,
  ): Promise<MedicineDto | null>;
  remove(userId: string, id: string): Promise<boolean>;
};

export type TickResult =
  | { ok: true; log: DoseLogDto }
  | {
      ok: false;
      reason: 'medicine_not_found' | 'time_not_planned' | 'already_ticked';
    };

export type DoseLogRepo = {
  listForDay(userId: string, doseDate: string): Promise<DoseLogDto[]>;
  tick(userId: string, input: DoseLogInput): Promise<TickResult>;
  remove(userId: string, id: string): Promise<boolean>;
};

/** Postgres returns "08:00:00"; the app uses "08:00". */
const hhmm = (time: string) => time.slice(0, 5);
const sortTimes = (times: string[]) => times.map(hhmm).sort();

const medicineColumns = {
  id: medicines.id,
  name: medicines.name,
  doseText: medicines.doseText,
  times: medicines.times,
};

type MedicineRow = {
  id: string;
  name: string;
  doseText: string;
  times: string[];
};
const toMedicine = (row: MedicineRow): MedicineDto => ({
  ...row,
  times: sortTimes(row.times),
});

const doseLogColumns = {
  id: doseLogs.id,
  medicineId: doseLogs.medicineId,
  doseDate: doseLogs.doseDate,
  scheduledTime: doseLogs.scheduledTime,
  takenAt: doseLogs.takenAt,
};

type DoseLogRow = {
  id: string;
  medicineId: string;
  doseDate: string;
  scheduledTime: string;
  takenAt: Date;
};
const toDoseLog = (row: DoseLogRow): DoseLogDto => ({
  ...row,
  scheduledTime: hhmm(row.scheduledTime),
  takenAt: row.takenAt.toISOString(),
});

export function createMedicineRepo(getDb: () => Db): MedicineRepo {
  const owned = (userId: string, id: string) =>
    and(eq(medicines.id, id), eq(medicines.userId, userId));

  return {
    async list(userId) {
      const rows = await getDb()
        .select(medicineColumns)
        .from(medicines)
        .where(eq(medicines.userId, userId))
        .orderBy(asc(medicines.name));
      return rows.map(toMedicine);
    },

    async get(userId, id) {
      const [row] = await getDb()
        .select(medicineColumns)
        .from(medicines)
        .where(owned(userId, id));
      return row ? toMedicine(row) : null;
    },

    async create(userId, input) {
      const [row] = await getDb()
        .insert(medicines)
        .values({ ...input, userId })
        .returning(medicineColumns);
      if (!row) throw new Error('insert returned no row');
      return toMedicine(row);
    },

    async update(userId, id, patch) {
      const [row] = await getDb()
        .update(medicines)
        .set({ ...patch, updatedAt: sql`now()` })
        .where(owned(userId, id))
        .returning(medicineColumns);
      return row ? toMedicine(row) : null;
    },

    async remove(userId, id) {
      const rows = await getDb()
        .delete(medicines)
        .where(owned(userId, id))
        .returning({ id: medicines.id });
      return rows.length > 0;
    },
  };
}

export function createDoseLogRepo(
  getDb: () => Db,
  medicineRepo: MedicineRepo,
): DoseLogRepo {
  return {
    async listForDay(userId, doseDate) {
      const rows = await getDb()
        .select(doseLogColumns)
        .from(doseLogs)
        .where(
          and(eq(doseLogs.userId, userId), eq(doseLogs.doseDate, doseDate)),
        );
      return rows.map(toDoseLog);
    },

    async tick(userId, input) {
      const medicine = await medicineRepo.get(userId, input.medicineId);
      if (!medicine) return { ok: false, reason: 'medicine_not_found' };
      if (!medicine.times.includes(input.scheduledTime)) {
        return { ok: false, reason: 'time_not_planned' };
      }
      const [row] = await getDb()
        .insert(doseLogs)
        .values({ ...input, userId, takenAt: new Date() })
        .onConflictDoNothing()
        .returning(doseLogColumns);
      return row
        ? { ok: true, log: toDoseLog(row) }
        : { ok: false, reason: 'already_ticked' };
    },

    async remove(userId, id) {
      const rows = await getDb()
        .delete(doseLogs)
        .where(and(eq(doseLogs.id, id), eq(doseLogs.userId, userId)))
        .returning({ id: doseLogs.id });
      return rows.length > 0;
    },
  };
}
