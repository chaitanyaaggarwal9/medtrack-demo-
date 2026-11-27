import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../src/db/schema.ts';
import { HttpError } from './http.ts';

export type Db = ReturnType<typeof createDb>;

export function createDb(url: string) {
  return drizzle({ client: neon(url), schema });
}

/** True only for a real Postgres connection string (not "not-set-yet"). */
export function isDatabaseUrl(url: string | undefined): url is string {
  return typeof url === 'string' && /^postgres(ql)?:\/\//.test(url);
}

let cached: { url: string; db: Db } | undefined;

/** The database, or a friendly 500 if DATABASE_URL is not set up. */
export function getDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!isDatabaseUrl(url)) {
    throw new HttpError(
      500,
      'The app is not set up yet. Please try again later.',
    );
  }
  if (cached?.url !== url) cached = { url, db: createDb(url) };
  return cached.db;
}

/** Is the database reachable? true/false only: never error details. */
export async function pingDb(timeoutMs = 3000): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const db = getDb();
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
    });
    await Promise.race([db.execute(sql`select 1`), timeout]);
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
