/** Shapes the API sends back. user_id is never sent to the browser. */

export type MedicineDto = {
  id: string;
  name: string;
  doseText: string;
  /** "HH:MM", earliest first. */
  times: string[];
};

export type DoseLogDto = {
  id: string;
  medicineId: string;
  /** The user's own day, "YYYY-MM-DD". */
  doseDate: string;
  /** Which planned dose was ticked, "HH:MM". */
  scheduledTime: string;
  /** When it was ticked (ISO date-time, UTC). */
  takenAt: string;
};

export type ApiErrorBody = {
  error: string;
  /** Per-field messages for form errors (400). */
  fields?: Record<string, string>;
};
