// npm run db:migrate: applies the SQL files in ./drizzle to DATABASE_URL.
// Runs locally (reads .env) and in the deploy pipeline (GitHub secrets).
// Skips ONLY while DATABASE_URL is empty or the placeholder "not-set-yet",
// so deploys keep working until a real database is connected. Any other
// value that is not a Postgres URL (e.g. a typo) fails loudly, so a deploy
// never goes out with an out-of-date database. Never prints DATABASE_URL.
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

const url = (process.env.DATABASE_URL ?? '').trim();

if (url === '' || url === 'not-set-yet') {
  console.log('db:migrate skipped: DATABASE_URL is not set yet.');
  process.exit(0);
}
if (!/^postgres(ql)?:\/\//.test(url)) {
  console.error(
    'db:migrate failed: DATABASE_URL is set but is not a Postgres URL. Check the secret.',
  );
  process.exit(1);
}

try {
  await migrate(drizzle({ client: neon(url) }), {
    migrationsFolder: 'drizzle',
  });
  console.log('db:migrate done.');
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  // Hide anything that looks like a connection string, just in case.
  console.error(
    'db:migrate failed:',
    message.replace(/postgres(ql)?:\/\/\S+/g, '[hidden]'),
  );
  process.exit(1);
}
