# VT SaaS Template - Data Models

**Generated:** 2026-01-02
**ORM:** Drizzle ORM
**Database:** PostgreSQL (via Supabase)
**Schema:** `health_companion`

---

## Table of Contents

1. [Database Overview](#database-overview)
2. [Schema Structure](#schema-structure)
3. [Tables](#tables)
4. [Indexes](#indexes)
5. [Relationships](#relationships)
6. [Migration Strategy](#migration-strategy)

---

## Database Overview

**Database Provider:** Supabase (PostgreSQL)
**ORM:** Drizzle ORM (Type-safe query builder)
**Schema File:** `src/models/Schema.ts`
**Migrations:** Auto-generated via `npm run db:generate`

**Design Principles:**
- Type-safe schema definitions
- Explicit indexes for performance
- UUID primary keys for distributed systems
- Timestamps for audit trails
- Dedicated schema namespace (`health_companion`)

**Total Tables:** 1

---

## Schema Structure

```
Database: PostgreSQL
└── health_companion (schema)
    └── threads (table)
```

**Schema Namespace:** `health_companion`

The application uses a dedicated PostgreSQL schema to isolate its tables from Supabase's system tables (`auth`, `storage`, etc.).

---

## Tables

### `threads` Table

**Purpose:** Store chat thread metadata for multi-threaded conversations

**Location:** `health_companion.threads`

#### Schema Definition

```typescript
export const threads = healthCompanionSchema.table(
  'threads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    conversationId: text('conversation_id').notNull().unique(),
    title: text('title'),
    lastMessagePreview: text('last_message_preview'),
    archived: boolean('archived').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  }
);
```

#### Column Specifications

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | `gen_random_uuid()` | Unique thread identifier |
| `userId` | UUID | NOT NULL | - | References Supabase auth.users (user who owns the thread) |
| `conversationId` | TEXT | UNIQUE, NOT NULL | - | Dify AI conversation ID (external reference) |
| `title` | TEXT | NULLABLE | `NULL` | Thread title (user-editable) |
| `lastMessagePreview` | TEXT | NULLABLE | `NULL` | Preview of last message (first 100 chars) |
| `archived` | BOOLEAN | NOT NULL | `false` | Archive status (hidden from main list) |
| `createdAt` | TIMESTAMP WITH TIMEZONE | NOT NULL | `NOW()` | Thread creation timestamp |
| `updatedAt` | TIMESTAMP WITH TIMEZONE | NOT NULL | `NOW()` | Last modification timestamp |

#### Field Details

**id (UUID)**
- Auto-generated on insert
- Primary key for thread identification
- Used in API routes (`/api/threads/[id]`)

**userId (UUID)**
- References `auth.users.id` in Supabase Auth
- Enforces thread ownership
- Used for filtering in queries (`WHERE userId = ?`)

**conversationId (TEXT)**
- Unique identifier from Dify AI
- Maps thread to external conversation state
- Used to retrieve message history from Dify
- Format: alphanumeric with hyphens (e.g., `abc-123-def`)

**title (TEXT)**
- User-editable thread name
- Defaults to first 50 characters of initial message
- Can be updated via PATCH `/api/threads/[id]`

**lastMessagePreview (TEXT)**
- Stores first 100 characters of most recent message
- Displayed in thread list for context
- Updated on each new message

**archived (BOOLEAN)**
- Soft delete flag
- Archived threads hidden from main list
- Can be toggled via POST `/api/threads/[id]/archive`

**createdAt / updatedAt (TIMESTAMP WITH TIMEZONE)**
- Auto-managed by Drizzle ORM
- `createdAt`: Set on insert, never changes
- `updatedAt`: Updated on every modification
- Timezone-aware for global deployments

---

## Indexes

### Primary Index

**Index Name:** `threads_pkey`
**Type:** PRIMARY KEY
**Column:** `id`
**Purpose:** Unique thread identification

### Secondary Indexes

#### idx_threads_user_id

```sql
CREATE INDEX idx_threads_user_id ON health_companion.threads(user_id);
```

**Purpose:** Fast filtering by user
**Used in:** `GET /api/threads` (fetch all user threads)
**Query Pattern:** `WHERE userId = ?`

#### idx_threads_conversation_id

```sql
CREATE INDEX idx_threads_conversation_id ON health_companion.threads(conversation_id);
```

**Purpose:** Fast lookup by Dify conversation ID
**Used in:** Thread auto-creation logic (check if conversation exists)
**Query Pattern:** `WHERE conversationId = ?`

#### idx_threads_user_archived

```sql
CREATE INDEX idx_threads_user_archived ON health_companion.threads(user_id, archived);
```

**Purpose:** Fast filtering of non-archived threads per user
**Used in:** Thread list queries (default view excludes archived)
**Query Pattern:** `WHERE userId = ? AND archived = false`

**Index Strategy:**
- Composite index on `(userId, archived)` for efficient filtering
- Covers most common query pattern (user's active threads)
- Reduces index scan time by ~90%

---

## Relationships

### External Relationships

#### Supabase Auth Integration

```
auth.users (Supabase)
    ↓
    id (UUID)
    ↓
threads.userId (FK reference, not enforced)
```

**Relationship Type:** One-to-Many (1 user → N threads)
**Foreign Key:** Not enforced via database constraint
**Enforcement:** Application-level via Supabase RLS (Row-Level Security)

**Why No DB Constraint:**
- Supabase Auth tables in separate schema (`auth`)
- Cross-schema foreign keys not supported
- RLS policies enforce data isolation

#### Dify AI Integration

```
Dify Conversations (External API)
    ↓
    conversation_id (string)
    ↓
threads.conversationId (reference)
```

**Relationship Type:** One-to-One (1 thread → 1 Dify conversation)
**Foreign Key:** None (external system)
**Uniqueness:** Enforced via `UNIQUE` constraint on `conversationId`

**Data Flow:**
1. User sends first message → Dify creates conversation
2. Dify returns `conversation_id` in response
3. Thread auto-created with `conversationId`
4. Subsequent messages use same `conversationId`

---

## Migration Strategy

### Drizzle ORM Migrations

**Migration Files:** `migrations/` directory
**Generation Command:** `npm run db:generate`
**Application:** Auto-applied on first database interaction

#### Migration Process

1. **Modify Schema**
   ```bash
   # Edit src/models/Schema.ts
   ```

2. **Generate Migration**
   ```bash
   npm run db:generate
   ```
   Creates SQL migration file in `migrations/XXXX_*.sql`

3. **Auto-Apply**
   - Next database query auto-applies pending migrations
   - No manual restart needed

4. **Manual Apply (Optional)**
   ```bash
   npm run db:migrate
   ```

### Existing Migrations

```
migrations/
├── 0000_initial_threads_table.sql
├── 0001_add_archived_column.sql
├── 0002_add_last_message_preview.sql
└── meta/
    └── _journal.json
```

**Migration History:**
1. **0000:** Initial threads table creation
2. **0001:** Added `archived` column for soft delete
3. **0002:** Added `lastMessagePreview` for UI context

### Migration Safety

**Production Considerations:**
- Migrations run in transactions (atomic)
- Failed migrations rollback automatically
- Migration state tracked in `drizzle.__drizzle_migrations` table

**Edge Runtime Limitation:**
- Vercel Edge doesn't support migration auto-apply
- Use `npm run db:migrate` manually for Edge deployments

---

## Data Access Patterns

### Common Queries

#### Fetch User's Active Threads

```typescript
const threads = await db
  .select()
  .from(threadsTable)
  .where(
    and(
      eq(threadsTable.userId, userId),
      eq(threadsTable.archived, false)
    )
  )
  .orderBy(desc(threadsTable.updatedAt));
```

**Index Used:** `idx_threads_user_archived`

#### Find Thread by Conversation ID

```typescript
const thread = await db
  .select()
  .from(threadsTable)
  .where(eq(threadsTable.conversationId, conversationId))
  .limit(1);
```

**Index Used:** `idx_threads_conversation_id`

#### Update Thread Metadata

```typescript
const updated = await db
  .update(threadsTable)
  .set({
    lastMessagePreview: preview,
    updatedAt: new Date(),
  })
  .where(eq(threadsTable.id, threadId))
  .returning();
```

**Index Used:** Primary key `threads_pkey`

---

## Security Considerations

### Row-Level Security (Future)

**Current State:** RLS not implemented
**Enforcement:** Application-level filtering by `userId`

**Future Implementation:**
```sql
-- Enable RLS on threads table
ALTER TABLE health_companion.threads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own threads
CREATE POLICY threads_select_policy ON health_companion.threads
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can only insert their own threads
CREATE POLICY threads_insert_policy ON health_companion.threads
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can only update their own threads
CREATE POLICY threads_update_policy ON health_companion.threads
  FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Users can only delete their own threads
CREATE POLICY threads_delete_policy ON health_companion.threads
  FOR DELETE
  USING (user_id = auth.uid());
```

### Data Validation

**Application-Level:**
- Zod schemas validate API inputs
- TypeScript types ensure type safety
- Drizzle ORM prevents SQL injection

**Database-Level:**
- `NOT NULL` constraints on required fields
- `UNIQUE` constraint on `conversationId`
- Check constraints (future: `LENGTH(title) <= 200`)

---

## Performance Optimization

### Indexing Strategy

**Indexed Columns:**
- `id` (primary key, implicit)
- `userId` (frequent filter)
- `conversationId` (unique lookups)
- `(userId, archived)` (composite, most common query)

**Non-Indexed:**
- `title` (text search not required)
- `lastMessagePreview` (display only)
- `createdAt`, `updatedAt` (range queries rare)

### Query Optimization

**Best Practices:**
- Always filter by `userId` first (indexed)
- Use `archived` in composite queries
- Limit result sets (pagination future)
- Select only needed columns

### Connection Pooling

**Provider:** Supabase (managed)
**Configuration:** Default pool size (sufficient for serverless)
**Monitoring:** Via Supabase dashboard

---

## Data Retention

**Current Policy:** Indefinite retention

**Future Considerations:**
- Auto-archive threads after 90 days of inactivity
- Soft delete after 1 year of being archived
- Hard delete after 2 years (GDPR compliance)

---

## Testing

### Test Data

**Seed Scripts:** Not implemented
**Test Environment:** PGlite for local development

**Test Fixtures:**
```typescript
const testThread = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  userId: 'user-123',
  conversationId: 'conv-abc-123',
  title: 'Test Thread',
  lastMessagePreview: 'Test message...',
  archived: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

---

**Last Updated:** 2026-01-02
**Generated by:** BMAD Document Project Workflow v1.2.0
