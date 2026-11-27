// npm run db:seed: loads the made-up rows in docs/demo-data.json.
// Safe to run twice (rows that already exist are skipped).
// Refuses to run in production. Never prints DATABASE_URL.
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { doseLogs, medicines, users } from '../src/db/schema.ts';

type DemoData = {
  users: { id: string; google_sub: string; email: string }[];
  medicines: {
    id: string;
    user_id: string;
    name: string;
    dose_text: string;
    times: string[];
  }[];
  dose_logs: {
    id: string;
    user_id: string;
    medicine_id: string;
    dose_date: string;
    scheduled_time: string;
    taken_at: string;
  }[];
};

if (process.env.APP_ENV === 'production') {
  console.error('db:seed refused: never load demo data into production.');
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url || !/^postgres(ql)?:\/\//.test(url)) {
  console.error(
    'db:seed: DATABASE_URL is not set. Add it to your .env file first.',
  );
  process.exit(1);
}

const data = JSON.parse(
  readFileSync('docs/demo-data.json', 'utf8'),
) as DemoData;
const db = drizzle({ client: neon(url) });

try {
  await db
    .insert(users)
    .values(
      data.users.map((u) => ({
        id: u.id,
        googleSub: u.google_sub,
        email: u.email,
      })),
    )
    .onConflictDoNothing();
  await db
    .insert(medicines)
    .values(
      data.medicines.map((m) => ({
        id: m.id,
        userId: m.user_id,
        name: m.name,
        doseText: m.dose_text,
        times: m.times,
      })),
    )
    .onConflictDoNothing();
  await db
    .insert(doseLogs)
    .values(
      data.dose_logs.map((l) => ({
        id: l.id,
        userId: l.user_id,
        medicineId: l.medicine_id,
        doseDate: l.dose_date,
        scheduledTime: l.scheduled_time,
        takenAt: new Date(l.taken_at),
      })),
    )
    .onConflictDoNothing();

  console.log(
    `db:seed done: ${data.users.length} users, ${data.medicines.length} medicines, ` +
      `${data.dose_logs.length} dose logs (existing rows skipped).`,
  );
  console.log(`Demo user 1 id (use as DEMO_USER_ID): ${data.users[0]?.id}`);
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  console.error(
    'db:seed failed:',
    message.replace(/postgres(ql)?:\/\/\S+/g, '[hidden]'),
  );
  process.exit(1);
}
