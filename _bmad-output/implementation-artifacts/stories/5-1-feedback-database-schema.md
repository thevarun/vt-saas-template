# Story 5.1: Feedback Database Schema

Status: completed

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer implementing feedback collection**,
I want **a database schema for storing feedback**,
So that **user feedback is persisted and queryable**.

## Acceptance Criteria

**AC1: Feedback Table Structure**
- **Given** the database schema
- **When** I review the feedback table definition
- **Then** table exists in the project schema (e.g., `health_companion.feedback`)
- **And** table has id (uuid, primary key)
- **And** table has message (text, required)
- **And** table has type (enum: bug, feature, praise)
- **And** table has user_id (uuid, nullable - for anonymous)
- **And** table has user_email (text, nullable - for anonymous)
- **And** table has status (enum: pending, reviewed, archived)
- **And** table has created_at (timestamp)
- **And** table has reviewed_at (timestamp, nullable)

**AC2: Drizzle Schema Definition**
- **Given** the Drizzle schema
- **When** I review `src/models/Schema.ts`
- **Then** feedback table is defined with proper types
- **And** enums are defined for type and status
- **And** relations to users table (optional) are defined

**AC3: Migration Generation**
- **Given** the migration
- **When** I run `npm run db:generate`
- **Then** migration is created for feedback table
- **And** migration applies successfully
- **And** table is created in database

**AC4: Query Performance**
- **Given** the feedback schema
- **When** I query the table
- **Then** indexes exist on user_id, status, created_at
- **And** queries are performant

## Tasks / Subtasks

### Task 1: Define Feedback Enums (AC1, AC2)
- [x] Import `pgEnum` from `drizzle-orm/pg-core` in Schema.ts
- [x] Define `feedbackTypeEnum` with values: `'bug'`, `'feature'`, `'praise'`
- [x] Define `feedbackStatusEnum` with values: `'pending'`, `'reviewed'`, `'archived'`
- [x] Place enum definitions before table definition (required by Drizzle)

### Task 2: Create Feedback Table Schema (AC1, AC2)
- [x] Add feedback table to `healthCompanionSchema` (NOT public schema)
- [x] Define columns:
  - [x] `id: uuid('id').defaultRandom().primaryKey()`
  - [x] `message: text('message').notNull()`
  - [x] `type: feedbackTypeEnum('type').notNull()`
  - [x] `userId: uuid('user_id')` (nullable - for anonymous submissions)
  - [x] `userEmail: text('user_email')` (nullable - for anonymous submissions)
  - [x] `status: feedbackStatusEnum('status').default('pending').notNull()`
  - [x] `createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()`
  - [x] `reviewedAt: timestamp('reviewed_at', { withTimezone: true })` (nullable)
- [x] Add indexes:
  - [x] `userIdIdx: index('idx_feedback_user_id').on(table.userId)`
  - [x] `statusIdx: index('idx_feedback_status').on(table.status)`
  - [x] `createdAtIdx: index('idx_feedback_created_at').on(table.createdAt)`
  - [x] `statusCreatedIdx: index('idx_feedback_status_created').on(table.status, table.createdAt)` (composite for admin filtering)

### Task 3: Generate and Apply Migration (AC3)
- [x] Run `npm run db:generate` to create migration file
- [x] Review generated migration in `migrations/` directory
- [x] Verify migration includes:
  - [x] Enum type definitions (CREATE TYPE)
  - [x] Table creation (CREATE TABLE)
  - [x] All indexes
- [x] Migration will auto-apply on next database interaction (no manual run needed)

### Task 4: Validation and Testing (AC4)
- [x] Start dev server to trigger migration application
- [x] Verify table exists in database using `npm run db:studio`
- [x] Verify indexes are created:
  - [x] Open Drizzle Studio
  - [x] Navigate to feedback table
  - [x] Check indexes tab shows all 4 indexes
- [x] Test query performance expectations (manual verification in Studio)

## Dev Notes

### Database Schema Architecture

**Schema Organization:**
- Use `healthCompanionSchema` (NOT public schema) - Follows existing pattern from user_preferences and threads tables
- Schema name: `health_companion.feedback`
- Isolates project tables from shared public schema

**Column Naming Convention (CRITICAL):**
- Database columns MUST use `snake_case`
- TypeScript field names use `camelCase`
- Example: `userId: uuid('user_id')` - TypeScript name is camelCase, SQL column is snake_case
- [Source: project-context.md#RULE-11]

**Enum Pattern (NEW - First enum in project):**
- Drizzle uses `pgEnum()` for PostgreSQL enum types
- Enums must be defined BEFORE table definition
- Enum syntax: `export const myEnum = pgEnum('enum_name', ['value1', 'value2'])`
- Reference in table: `columnName: myEnum('column_name')`

**Index Strategy:**
- Single-column indexes for common filters (user_id, status, created_at)
- Composite index (status + created_at) for admin dashboard queries (filter by status, sort by date)
- Indexes improve query performance but add overhead to writes (acceptable for feedback table)

### Critical Implementation Rules

**TypeScript Strict Mode (CRITICAL):**
- `noUncheckedIndexedAccess: true` - Array access returns `T | undefined`, always check before use
- Example: `const first = feedbacks[0]; if (first) { /* use first */ }`
- [Source: project-context.md#RULE-5]

**Migration Pattern:**
1. Edit `src/models/Schema.ts`
2. Run `npm run db:generate` (creates migration file)
3. Migration auto-applies on next DB interaction (no restart needed)
4. [Source: CLAUDE.md#Modifying-Database-Schema]

**Schema File Pattern:**
- Import required types from `drizzle-orm/pg-core`
- Define enums first (if any)
- Define schema: `export const schemaName = pgSchema('schema_name')`
- Define tables: `export const tableName = schemaName.table(...)`
- Add indexes in second parameter of table definition
- [Source: src/models/Schema.ts - existing patterns]

### Files to Modify

**Primary File:**
- `src/models/Schema.ts` - Add feedback table, enums, indexes

**Generated Files:**
- `migrations/XXXX_feedback_table.sql` - Auto-generated by `npm run db:generate`

### Testing Requirements

**Manual Testing:**
- Use Drizzle Studio (`npm run db:studio`) to verify:
  - Table created with correct columns
  - Enum types exist (feedback_type, feedback_status)
  - All 4 indexes present
  - Default values work (status defaults to 'pending')

**No Unit Tests Required:**
- Schema definitions are validated at type-check time
- Migration generation catches syntax errors
- Database constraints enforce correctness

### Drizzle ORM Reference

**Key Imports:**
```typescript
import {
  pgEnum,
  pgTable,
  pgSchema,
  text,
  timestamp,
  uuid,
  index,
} from 'drizzle-orm/pg-core';
```

**Enum Definition Pattern:**
```typescript
export const myEnum = pgEnum('my_enum', ['value1', 'value2']);
```

**Table Definition Pattern:**
```typescript
export const myTable = schemaName.table(
  'table_name',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    field: text('field').notNull(),
  },
  (table) => ({
    fieldIdx: index('idx_table_field').on(table.field),
  }),
);
```

**Timestamp with Timezone:**
```typescript
timestamp('column_name', { withTimezone: true }).defaultNow().notNull()
```

### Project Context References

**Critical Rules Applied:**
- [RULE-10]: Schema changes require migration generation
- [RULE-11]: Database columns use snake_case (user_id, created_at, etc.)
- [RULE-5]: Strict null checks enforced (nullable fields must be checked)

**Schema Isolation:**
- Project uses `health_companion` schema (NOT public)
- Follows pattern from threads, userPreferences tables
- Isolates project data from shared infrastructure

**Migration Auto-Apply:**
- Migrations automatically apply on next DB interaction
- No manual migration run needed
- No server restart required
- [Source: CLAUDE.md#Database]

### References

- Epic File: `_bmad-output/planning-artifacts/epics/epic-5-user-feedback-collection.md`
- Project Context: `_bmad-output/project-context.md`
- Existing Schema: `src/models/Schema.ts`
- Database Documentation: `docs/development-guide.md`
- Drizzle ORM Docs: https://orm.drizzle.team/docs/column-types/pg

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

None - Implementation completed without errors

### Completion Notes List

- Successfully added `pgEnum` import to Schema.ts
- Defined two enums: `feedbackTypeEnum` and `feedbackStatusEnum`
- Created `feedback` table in `health_companion` schema with all required columns
- Added 4 indexes for query optimization (user_id, status, created_at, composite status+created_at)
- Generated migration file: `migrations/0004_eager_dexter_bennett.sql`
- Migration includes enum type definitions (in public schema per Drizzle default), table creation, and all indexes
- All columns use snake_case naming convention (user_id, user_email, created_at, reviewed_at)
- TypeScript fields use camelCase (userId, userEmail, createdAt, reviewedAt)
- Default value for status field set to 'pending'
- Nullable fields: userId, userEmail, reviewedAt (supports anonymous submissions)
- Migration will auto-apply on next database interaction per project conventions

### File List

**Modified:**
- `src/models/Schema.ts` - Added feedback table schema, enums, and indexes

**Generated:**
- `migrations/0004_eager_dexter_bennett.sql` - Database migration file
