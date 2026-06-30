import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './migrations',
  schema: './src/models/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  // scope introspection to this fork's schema so drizzle-kit never touches sibling schemas on a shared dev Postgres
  schemaFilter: [process.env.DB_SCHEMA!],
  verbose: true,
  strict: true,
});
