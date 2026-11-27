import { defineConfig } from 'drizzle-kit';

// npm run db:generate turns src/db/schema.ts into SQL files in ./drizzle.
// It does not need a database connection.
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
});
