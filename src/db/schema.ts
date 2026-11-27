import { sql } from 'drizzle-orm';
import {
  check,
  date,
  foreignKey,
  index,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * Database tables. The design and the reason for each choice are in
 * docs/data-model.md. Every user-owned table has user_id.
 */

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  googleSub: text('google_sub').notNull().unique(),
  email: text('email').notNull(),
  ...timestamps,
});

export const medicines = pgTable(
  'medicines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    doseText: varchar('dose_text', { length: 100 }).notNull(),
    times: time('times').array().notNull(),
    ...timestamps,
  },
  (t) => [
    // Lets dose_logs check that a medicine belongs to the same user.
    unique('medicines_id_user_id_unique').on(t.id, t.userId),
    index('medicines_user_id_idx').on(t.userId),
    check(
      'medicines_times_count',
      sql`cardinality(${t.times}) between 1 and 6`,
    ),
  ],
);

export const doseLogs = pgTable(
  'dose_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    medicineId: uuid('medicine_id').notNull(),
    doseDate: date('dose_date').notNull(),
    scheduledTime: time('scheduled_time').notNull(),
    takenAt: timestamp('taken_at', { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [
    // A user can only log a dose against their OWN medicine.
    foreignKey({
      name: 'dose_logs_medicine_owner_fk',
      columns: [t.medicineId, t.userId],
      foreignColumns: [medicines.id, medicines.userId],
    }).onDelete('cascade'),
    // The same dose cannot be ticked twice on the same day.
    unique('dose_logs_one_tick_per_dose').on(
      t.medicineId,
      t.doseDate,
      t.scheduledTime,
    ),
    index('dose_logs_user_date_idx').on(t.userId, t.doseDate),
  ],
);
