# Data Models

**Generated:** 2026-02-23 | **Scan Level:** Quick (rescan) | **ORM:** Drizzle ORM 0.45.1 | **Database:** PostgreSQL

---

## Schema Overview

Tables live in a configurable PostgreSQL schema (set via `DB_SCHEMA` env var) to isolate project tables from `public`. All tables use UUID primary keys and timestamps.

**Schema File:** `src/models/Schema.ts` | **Migrations:** `migrations/` (7 SQL files + meta)

---

## Tables

### threads
Dify chat conversations | **Schema:** `DB_SCHEMA`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| userId | uuid | NOT NULL |
| conversationId | text | UNIQUE |
| title | text | |
| lastMessagePreview | text | |
| archived | boolean | DEFAULT false |
| createdAt / updatedAt | timestamp | DEFAULT now() |

**Indexes:** user_id, conversation_id, user+archived | **RLS:** Users access own only

### userPreferences
User settings | **Schema:** `DB_SCHEMA`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| userId | uuid | UNIQUE |
| username | text | UNIQUE |
| displayName | text | |
| emailNotifications | boolean | DEFAULT true |
| language | text | DEFAULT 'en' |
| createdAt / updatedAt | timestamp | DEFAULT now() |

### adminAuditLog
Admin action tracking | **Schema:** `DB_SCHEMA`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| adminId | uuid | NOT NULL |
| action | text | suspend/unsuspend/delete/reset_password |
| targetType | text | 'user' |
| targetId | uuid | |
| metadata | jsonb | { reason?, ...custom } |
| createdAt | timestamp | DEFAULT now() |

### feedback
User feedback | **Schema:** `DB_SCHEMA`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| message | text | NOT NULL |
| type | enum | bug / feature / praise |
| userId | uuid | Nullable |
| userEmail | text | Nullable |
| status | enum | pending / reviewed / archived |
| createdAt | timestamp | |
| reviewedAt | timestamp | Nullable |

### vercelConversations
Vercel AI SDK conversations | **Schema:** `DB_SCHEMA`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| userId | uuid | NOT NULL |
| title | text | |
| lastMessagePreview | text | |
| archived | boolean | DEFAULT false |
| createdAt / updatedAt | timestamp | |

### vercelMessages
Chat message history | **Schema:** `DB_SCHEMA`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| conversationId | uuid | FK -> vercelConversations (CASCADE) |
| role | text | user / assistant / system |
| content | text | |
| tokenCount | integer | Nullable |
| latencyMs | integer | Nullable |
| createdAt | timestamp | |

### shareableLinks
Private share URLs | **Schema:** `DB_SCHEMA`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| token | text | UNIQUE (256-bit) |
| resourceType | text | |
| resourceId | uuid | |
| createdBy | uuid | |
| expiresAt | timestamp | Nullable |
| accessCount | integer | DEFAULT 0 |
| isActive | boolean | DEFAULT true |
| createdAt / updatedAt | timestamp | |

### mem0Memories
Conversation memory extraction | **Schema:** `DB_SCHEMA`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| userId | uuid | |
| conversationId | uuid | Nullable |
| memoryText | text | |
| memoryType | text | fact / preference / context |
| metadata | jsonb | |
| createdAt / updatedAt | timestamp | |

### memoryExtractionJobs
Async memory processing | **Schema:** `DB_SCHEMA`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| conversationId | uuid | |
| status | text | pending / processing / completed / failed |
| errorMessage | text | Nullable |
| createdAt | timestamp | |
| completedAt | timestamp | Nullable |

---

## Entity Relationships

```
Supabase Auth Users (external)
  |-- threads (userId)
  |-- userPreferences (userId, unique)
  |-- feedback (userId, nullable)
  |-- vercelConversations (userId)
  |   \-- vercelMessages (conversationId, cascade)
  |-- shareableLinks (createdBy)
  |-- mem0Memories (userId)
  \-- adminAuditLog (adminId, targetId)

memoryExtractionJobs -> vercelConversations (conversationId)
```

## Migration Strategy

- **Dev:** PGlite (in-memory) with auto-migration
- **Prod:** PostgreSQL with auto-migration on startup
- **Commands:** `pnpm db:generate` | `pnpm db:migrate` | `pnpm db:studio`
