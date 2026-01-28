import path from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { PHASE_PRODUCTION_BUILD } from 'next/dist/shared/lib/constants';
import { Pool } from 'pg';

import * as schema from '@/models/Schema';

import { Env } from './Env';

let drizzle;

// Stores the db connection in the global scope to prevent multiple instances due to hot reloading with Next.js
const globalForDb = globalThis as unknown as {
  pgPool: Pool;
  pgDrizzle: NodePgDatabase<typeof schema>;
  pgliteClient: PGlite;
  pgliteDrizzle: PgliteDatabase<typeof schema>;
};

// Need a database for production? Check out https://www.prisma.io/?via=saasboilerplatesrc
// Tested and compatible with Next.js Boilerplate
if (process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD && Env.DATABASE_URL) {
  // Check both pool AND drizzle instance exist (drizzle could be undefined if previous init failed)
  if (!globalForDb.pgPool || !globalForDb.pgDrizzle) {
    globalForDb.pgPool = new Pool({
      connectionString: Env.DATABASE_URL,
      max: 1, // Limit to single connection for serverless/dev environments
    });

    globalForDb.pgDrizzle = drizzlePg(globalForDb.pgPool, { schema });
    await migratePg(globalForDb.pgDrizzle, {
      migrationsFolder: path.join(process.cwd(), 'migrations'),
    });
  }

  drizzle = globalForDb.pgDrizzle;
} else {
  // Check both client AND drizzle instance exist
  if (!globalForDb.pgliteClient || !globalForDb.pgliteDrizzle) {
    globalForDb.pgliteClient = new PGlite();
    await globalForDb.pgliteClient.waitReady;

    globalForDb.pgliteDrizzle = drizzlePglite(globalForDb.pgliteClient, { schema });
    await migratePglite(globalForDb.pgliteDrizzle, {
      migrationsFolder: path.join(process.cwd(), 'migrations'),
    });
  }

  drizzle = globalForDb.pgliteDrizzle;
}

export const db = drizzle;
