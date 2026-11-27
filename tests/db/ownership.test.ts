// @vitest-environment node
//
// Runs the REAL queries against the database in DATABASE_URL, using the
// seeded demo data (npm run db:seed). Skipped when there is no database
// (for example in CI). Run with: npm run test:db
import { afterAll, describe, expect, it } from 'vitest';
import { createDb, isDatabaseUrl } from '../../netlify/lib/db.ts';
import {
  createDoseLogRepo,
  createMedicineRepo,
} from '../../netlify/lib/repo.ts';

const url = process.env.DATABASE_URL;
const USER_1 = 'a0000000-0000-4000-8000-000000000001';
const USER_2_MEDICINE = 'b0000000-0000-4000-8000-000000000005'; // Medicine E
const USER_2_LOG_DAY = '2026-11-15';

describe.skipIf(!isDatabaseUrl(url) || process.env.APP_ENV === 'production')(
  'database: a user only ever reaches their own rows',
  () => {
    const db = createDb(url ?? '');
    const medicines = createMedicineRepo(() => db);
    const doseLogs = createDoseLogRepo(() => db, medicines);
    const created: string[] = [];

    afterAll(async () => {
      for (const id of created) await medicines.remove(USER_1, id);
    });

    it("lists only user 1's medicines", async () => {
      const list = await medicines.list(USER_1);
      expect(list.length).toBeGreaterThan(0);
      expect(list.map((m) => m.id)).not.toContain(USER_2_MEDICINE);
    });

    it("cannot read, change or delete user 2's medicine, even with its id", async () => {
      expect(await medicines.get(USER_1, USER_2_MEDICINE)).toBeNull();
      expect(
        await medicines.update(USER_1, USER_2_MEDICINE, { name: 'Hacked' }),
      ).toBeNull();
      expect(await medicines.remove(USER_1, USER_2_MEDICINE)).toBe(false);
      // Still there and unchanged for user 2.
      const stillThere = await medicines.get(
        'a0000000-0000-4000-8000-000000000002',
        USER_2_MEDICINE,
      );
      expect(stillThere?.name).toBe('Medicine E');
    });

    it("cannot tick a dose on user 2's medicine", async () => {
      const result = await doseLogs.tick(USER_1, {
        medicineId: USER_2_MEDICINE,
        doseDate: '2026-11-20',
        scheduledTime: '07:30',
      });
      expect(result).toEqual({ ok: false, reason: 'medicine_not_found' });
    });

    it("does not see user 2's ticks", async () => {
      const logs = await doseLogs.listForDay(USER_1, USER_2_LOG_DAY);
      expect(logs.map((l) => l.medicineId)).not.toContain(USER_2_MEDICINE);
    });

    it('create, tick twice (409), undo and delete all work for my own medicine', async () => {
      const med = await medicines.create(USER_1, {
        name: 'Test medicine (auto-deleted)',
        doseText: '1 tablet',
        times: ['21:00', '09:00'],
      });
      created.push(med.id);
      expect(med.times).toEqual(['09:00', '21:00']);

      const input = {
        medicineId: med.id,
        doseDate: '2026-11-21',
        scheduledTime: '09:00',
      };
      const first = await doseLogs.tick(USER_1, input);
      expect(first.ok).toBe(true);
      expect(await doseLogs.tick(USER_1, input)).toEqual({
        ok: false,
        reason: 'already_ticked',
      });
      if (first.ok)
        expect(await doseLogs.remove(USER_1, first.log.id)).toBe(true);

      expect(await medicines.remove(USER_1, med.id)).toBe(true);
      created.pop();
    });
  },
);
