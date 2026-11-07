export type Dose = {
  id: string;
  /** Name of the medicine, as the user would write it. */
  medicine: string;
  /** Amount to take, e.g. "1 tablet". */
  amount: string;
  /** Planned time in 24-hour "HH:MM" format. */
  time: string;
};

/** Returns a new array of doses ordered by time (earliest first). */
export function sortByTime(doses: readonly Dose[]): Dose[] {
  // Zero-padded "HH:MM" strings sort correctly as plain text.
  return [...doses].sort((a, b) => a.time.localeCompare(b.time));
}

/** How many doses have not been ticked as taken yet. */
export function countRemaining(
  doses: readonly Dose[],
  takenIds: ReadonlySet<string>,
): number {
  return doses.filter((dose) => !takenIds.has(dose.id)).length;
}
