/** A medicine as the user typed it. Text fields are shown exactly as typed. */
export type Medicine = {
  id: number;
  name: string;
  /** Amount to take, e.g. "1 tablet". */
  dose: string;
  /** Planned times in 24-hour "HH:MM" format. One row is shown per time. */
  times: readonly string[];
};

/** One row on today's checklist: a single medicine at a single time. */
export type DoseRow = {
  /** Stable key for this medicine + time, e.g. "3-0800". */
  key: string;
  medicineId: number;
  name: string;
  dose: string;
  time: string;
  taken: boolean;
  /** Local "HH:MM" when the dose was ticked, if taken. */
  takenAt?: string;
};

export function doseKey(medicineId: number, time: string): string {
  return `${medicineId}-${time.replace(':', '')}`;
}

/**
 * Turns medicines into one row per planned time, ordered by time
 * (earliest first). Rows at the same time are ordered A–Z by name.
 */
export function buildTodayRows(
  medicines: readonly Medicine[],
  takenAt: ReadonlyMap<string, string>,
): DoseRow[] {
  const rows: DoseRow[] = medicines.flatMap((medicine) =>
    medicine.times.map((time) => {
      const key = doseKey(medicine.id, time);
      const at = takenAt.get(key);
      return {
        key,
        medicineId: medicine.id,
        name: medicine.name,
        dose: medicine.dose,
        time,
        taken: at !== undefined,
        ...(at !== undefined ? { takenAt: at } : {}),
      };
    }),
  );

  return rows.sort(
    (a, b) =>
      // Zero-padded "HH:MM" strings sort correctly as plain text.
      a.time.localeCompare(b.time) ||
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) ||
      a.medicineId - b.medicineId,
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

/** The user's own calendar day, e.g. "2026-11-07" (local time, not UTC). */
export function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local 24-hour "HH:MM". */
export function formatLocalTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Milliseconds from `date` until the next local midnight. */
export function msUntilNextLocalMidnight(date: Date): number {
  const midnight = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1,
  );
  return midnight.getTime() - date.getTime();
}

/** The summary line. Plain facts only: no praise or advice. */
export function remainingMessage(remaining: number, total: number): string {
  if (total === 0) return 'No doses planned for today.';
  const noun = total === 1 ? 'dose' : 'doses';
  if (remaining === 0) return `All ${total} ${noun} ticked for today.`;
  return `${remaining} of ${total} ${noun} still to take.`;
}
