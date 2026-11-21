import { z } from 'zod';

/**
 * Input rules shared by the API (server) and the forms (browser), so both
 * always agree. Limits match docs/data-model.md.
 */

/** 24-hour "HH:MM", e.g. "08:00" or "21:30". */
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
export const MAX_TIMES = 6;
export const MAX_TEXT = 100;

export const timeSchema = z
  .string()
  .regex(TIME_PATTERN, 'Use a 24-hour time like 08:00.');

const nameSchema = z
  .string()
  .trim()
  .min(1, 'Enter the medicine name.')
  .max(MAX_TEXT, `Keep the name to ${MAX_TEXT} characters or fewer.`);

const doseTextSchema = z
  .string()
  .trim()
  .min(1, 'Enter the dose exactly as it is written on the label.')
  .max(MAX_TEXT, `Keep the dose to ${MAX_TEXT} characters or fewer.`);

const timesSchema = z
  .array(timeSchema)
  .min(1, 'Add at least one time.')
  .max(MAX_TIMES, `You can add up to ${MAX_TIMES} times.`)
  .refine(
    (times) => new Set(times).size === times.length,
    'Each time can only be added once.',
  );

/** POST /api/medicines */
export const medicineInputSchema = z.strictObject({
  name: nameSchema,
  doseText: doseTextSchema,
  times: timesSchema,
});
export type MedicineInput = z.infer<typeof medicineInputSchema>;

/** PATCH /api/medicines/:id (send only the fields that change). */
export const medicineUpdateSchema = z
  .strictObject({
    name: nameSchema,
    doseText: doseTextSchema,
    times: timesSchema,
  })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, 'Nothing to update.');
export type MedicineUpdate = z.infer<typeof medicineUpdateSchema>;

/** Ids are random uuids. */
export const idSchema = z.uuid('That id is not valid.');

/** A calendar day "YYYY-MM-DD" (the user's own day). */
export const dateSchema = z.iso.date('Use a date like 2026-11-21.');

/** POST /api/dose-logs */
export const doseLogInputSchema = z.strictObject({
  medicineId: idSchema,
  doseDate: dateSchema,
  scheduledTime: timeSchema,
});
export type DoseLogInput = z.infer<typeof doseLogInputSchema>;

/** Turns a Zod error into { field: first message } for the forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? 'form');
    out[field] ??= issue.message;
  }
  return out;
}
