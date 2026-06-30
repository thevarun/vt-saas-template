// Ergonomic accessors over the generated `Database` type (src/libs/supabase/types.ts,
// produced by `npm run db:gen-types`). The CLI's own Tables/TablesInsert helpers key
// off a `public` schema, but the app schema name is configurable per-product via
// `DB_SCHEMA`, so we derive the app schema key generically instead of hardcoding it.
//
// Use these to type Supabase-JS write payloads:
//   const payload: TableInsert<'your_table'> = { ... }   // enforces required columns
// jsonb columns surface as `Json` (Postgres can't know the refined TS shape), so cast
// domain values to `Json` at the write boundary via `toJson()`.

import type { Database, Json } from '@/libs/supabase/types';

export type { Json };

// The generated `Database` has exactly one real schema key plus the
// `__InternalSupabase` metadata key — derive the app schema generically so this
// works whatever `DB_SCHEMA` a fork generates against.
type AppSchema = Exclude<keyof Database, '__InternalSupabase'>;
type AppTables = Database[AppSchema]['Tables'];

export type TableRow<T extends keyof AppTables> = AppTables[T]['Row'];
export type TableInsert<T extends keyof AppTables> = AppTables[T]['Insert'];
export type TableUpdate<T extends keyof AppTables> = AppTables[T]['Update'];

/**
 * Boundary cast for writing a refined domain value into a `jsonb` column typed as
 * `Json`. The value is JSON-serializable at runtime; TypeScript just can't prove
 * the structural match. Use ONLY at the DB write boundary — never to launder an
 * arbitrary shape.
 */
export function toJson(value: unknown): Json {
  return value as Json;
}
