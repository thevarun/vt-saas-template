import { pgSchema } from 'drizzle-orm/pg-core';

// DB_SCHEMA env var is required — no silent fallback.
// Dev (shared Supabase): use a project-specific schema like 'vt_saas'
// Prod (dedicated Supabase): use 'public'
// NOTE: This intentionally reads process.env directly because this module
// must be importable before the Zod env validator in Env.ts runs.
// The guard below provides the same fail-fast behavior.
if (!process.env.DB_SCHEMA) {
  throw new Error(
    'DB_SCHEMA environment variable is required. '
    + 'Set it to a project-specific name (e.g. "vt_saas") for shared dev, or "public" for dedicated instances.',
  );
}

export const DB_SCHEMA_NAME = process.env.DB_SCHEMA;
export const vtSaasSchema = pgSchema(DB_SCHEMA_NAME);
