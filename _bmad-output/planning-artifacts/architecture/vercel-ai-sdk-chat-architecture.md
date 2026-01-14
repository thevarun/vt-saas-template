# Vercel AI SDK Chat Architecture

## Overview

Epic 11 introduces a second chat implementation using Vercel AI SDK, providing template users with an alternative to the existing Dify-based chat. This implementation offers:

- **Full conversation control** - Messages stored locally in PostgreSQL
- **Provider flexibility** - OpenAI default, swappable to Anthropic, Google, etc.
- **Built-in observability** - LangFuse integration for tracing all LLM calls
- **Persistent memory** - Mem0 integration for cross-session user memory (opt-in)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
│  ┌───────────────────┐              ┌───────────────────┐      │
│  │   /chat/dify      │              │   /chat/vercel    │      │
│  │   (existing UI)   │              │   (new UI)        │      │
│  │                   │              │   - Conversation  │      │
│  │                   │              │     list sidebar  │      │
│  │                   │              │   - Message view  │      │
│  └─────────┬─────────┘              └─────────┬─────────┘      │
└────────────┼──────────────────────────────────┼────────────────┘
             │                                  │
┌────────────▼──────────────────────────────────▼────────────────┐
│                         API Layer                               │
│  ┌───────────────────┐              ┌───────────────────┐      │
│  │   /api/chat       │              │  /api/chat/vercel │      │
│  │   (Dify proxy)    │              │  - Streaming SSE  │      │
│  │                   │              │  - Auth required  │      │
│  │                   │              │  - Persists msgs  │      │
│  └─────────┬─────────┘              └─────────┬─────────┘      │
└────────────┼──────────────────────────────────┼────────────────┘
             │                                  │
             ▼                                  ▼
     ┌───────────────┐            ┌──────────────────────────────┐
     │     Dify      │            │      Vercel AI SDK           │
     │   (managed)   │            │   ┌────────────────────┐     │
     └───────────────┘            │   │   OpenAI Provider  │     │
                                  │   │   (swappable)      │     │
                                  │   └─────────┬──────────┘     │
                                  │             │                │
                                  │   ┌─────────▼──────────┐     │
                                  │   │  LangFuse Tracing  │     │
                                  │   │  (observability)   │     │
                                  │   └────────────────────┘     │
                                  │                              │
                                  │   ┌────────────────────┐     │
                                  │   │   Mem0 (opt-in)    │     │
                                  │   │   Async extraction │     │
                                  │   └────────────────────┘     │
                                  └──────────────┬───────────────┘
                                                 │
                                  ┌──────────────▼───────────────┐
                                  │      PostgreSQL (local)      │
                                  │  ┌────────────────────────┐  │
                                  │  │ vercel_conversations   │  │
                                  │  ├────────────────────────┤  │
                                  │  │ vercel_messages        │  │
                                  │  ├────────────────────────┤  │
                                  │  │ mem0_memories          │  │
                                  │  ├────────────────────────┤  │
                                  │  │ memory_extraction_jobs │  │
                                  │  └────────────────────────┘  │
                                  └──────────────────────────────┘
```

---

## Database Schema

### Schema Strategy: Single Namespace (vt_saas)

All tables use the `vt_saas` PostgreSQL schema namespace:

| Variable | Old | New |
|----------|-----|-----|
| Schema export | `healthCompanionSchema` | `vtSaasSchema` |
| PostgreSQL schema | `health_companion` | `vt_saas` |

**All Tables in `vt_saas` schema:**
| Table | Purpose |
|-------|---------|
| `threads` | Dify chat metadata |
| `vercel_conversations` | Vercel chat metadata |
| `vercel_messages` | Vercel chat messages |
| `mem0_memories` | User memories (Mem0) |
| `memory_extraction_jobs` | Async memory extraction queue |

**Migration Approach:**
- Old `health_companion` schema is **abandoned** (not deleted, not migrated)
- Fresh `vt_saas` schema created with all tables
- Existing deployments start with empty tables (fresh start)
- No data migration required

---

### User ID Reference Pattern

**Design Decision:** `user_id` columns do NOT have a foreign key constraint to `auth.users`.

**Rationale:**
- `auth.users` is managed by Supabase Auth, not Drizzle ORM
- Supabase's `auth` schema is separate from application schemas
- Foreign keys across schemas to Supabase-managed tables are not recommended
- RLS (Row Level Security) policies enforce user isolation at query time

**Data Integrity Approach:**
- Application-level validation ensures `user_id` matches authenticated user
- RLS policies on tables enforce `user_id = auth.uid()`
- User deletion cascades handled via Supabase Auth hooks (if needed)

```sql
-- Example RLS policy (applied during migration)
ALTER TABLE vt_saas.vercel_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own conversations"
ON vt_saas.vercel_conversations
FOR ALL
USING (user_id = auth.uid());
```

---

### Tables Overview (vt_saas schema)

| Table | Purpose | Relationship |
|-------|---------|--------------|
| `threads` | Dify chat conversation metadata | Belongs to user |
| `vercel_conversations` | Vercel chat session metadata | One-to-many with messages |
| `vercel_messages` | Individual chat messages | Belongs to conversation |
| `mem0_memories` | Extracted user memories | Belongs to user |
| `memory_extraction_jobs` | Async job queue for memory extraction | References conversation |

### Schema Definition

```typescript
// src/models/Schema.ts - COMPLETE REPLACEMENT
// Replaces healthCompanionSchema with vtSaasSchema

import {
  boolean,
  index,
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// ============================================
// Schema Namespace - vt_saas
// ============================================
// Replaces old 'health_companion' schema
// Old schema is abandoned, not deleted or migrated
export const vtSaasSchema = pgSchema('vt_saas');

// ============================================
// Dify Chat Tables
// ============================================

/**
 * Threads table - Dify chat conversation metadata
 * Same structure as before, now under vt_saas schema
 */
export const threads = vtSaasSchema.table(
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
  },
  (table) => ({
    userIdIdx: index('idx_threads_user_id').on(table.userId),
    conversationIdIdx: index('idx_threads_conversation_id').on(
      table.conversationId,
    ),
    userArchivedIdx: index('idx_threads_user_archived').on(
      table.userId,
      table.archived,
    ),
  }),
);

// ============================================
// Vercel AI SDK Chat Tables
// ============================================

/**
 * Conversations table - stores chat session metadata
 * Each conversation belongs to a user and contains multiple messages
 */
export const vercelConversations = vtSaasSchema.table(
  'vercel_conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // Note: No FK to auth.users - Supabase manages auth.users separately
    // Data integrity enforced via RLS policy: user_id = auth.uid()
    userId: uuid('user_id').notNull(),
    title: text('title'), // Auto-generated from first message or user-defined
    model: text('model').default('gpt-4o'), // LLM model used
    systemPrompt: text('system_prompt'), // Custom system prompt (optional)
    isArchived: boolean('is_archived').default(false).notNull(),
    messageCount: integer('message_count').default(0).notNull(),
    tokenCount: integer('token_count').default(0), // Total tokens used
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_vercel_conversations_user_id').on(table.userId),
    userArchivedIdx: index('idx_vercel_conversations_user_archived').on(
      table.userId,
      table.isArchived,
    ),
    updatedAtIdx: index('idx_vercel_conversations_updated_at').on(
      table.updatedAt,
    ),
  }),
);

/**
 * Messages table - stores individual chat messages
 * Supports user, assistant, and system roles
 */
export const vercelMessages = vtSaasSchema.table(
  'vercel_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => vercelConversations.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // 'user' | 'assistant' | 'system'
    content: text('content').notNull(),
    tokenCount: integer('token_count'), // Tokens for this message
    model: text('model'), // Model that generated this (for assistant messages)
    latencyMs: integer('latency_ms'), // Response time (for assistant messages)
    metadata: jsonb('metadata'), // Additional data (tool calls, etc.)
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    conversationIdIdx: index('idx_vercel_messages_conversation_id').on(
      table.conversationId,
    ),
    createdAtIdx: index('idx_vercel_messages_created_at').on(table.createdAt),
  }),
);

// ============================================
// Mem0 Memory Tables (Opt-in Feature)
// ============================================

/**
 * Memories table - stores extracted user memories from conversations
 * Memories are facts/preferences learned about the user over time
 */
export const mem0Memories = vtSaasSchema.table(
  'mem0_memories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // Note: No FK to auth.users - RLS enforced
    userId: uuid('user_id').notNull(),
    mem0Id: text('mem0_id'), // External ID from Mem0 API (if using cloud)
    content: text('content').notNull(), // The memory content
    category: text('category'), // Optional categorization: 'preference', 'fact', 'context'
    confidence: integer('confidence'), // 0-100 confidence score
    sourceConversationId: uuid('source_conversation_id').references(
      () => vercelConversations.id,
      { onDelete: 'set null' },
    ),
    metadata: jsonb('metadata'), // Additional context (source message, extraction timestamp)
    isActive: boolean('is_active').default(true).notNull(), // Soft delete
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_mem0_memories_user_id').on(table.userId),
    userActiveIdx: index('idx_mem0_memories_user_active').on(
      table.userId,
      table.isActive,
    ),
    categoryIdx: index('idx_mem0_memories_category').on(table.category),
  }),
);

/**
 * Memory extraction jobs - async queue for processing conversations
 * Decouples memory extraction from chat flow for better UX
 */
export const memoryExtractionJobs = vtSaasSchema.table(
  'memory_extraction_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => vercelConversations.id, { onDelete: 'cascade' }),
    // Note: No FK to auth.users - RLS enforced
    userId: uuid('user_id').notNull(),
    status: text('status').default('pending').notNull(), // 'pending' | 'processing' | 'completed' | 'failed'
    messagesProcessed: integer('messages_processed').default(0),
    memoriesExtracted: integer('memories_extracted').default(0),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    statusIdx: index('idx_memory_extraction_jobs_status').on(table.status),
    conversationIdx: index('idx_memory_extraction_jobs_conversation').on(
      table.conversationId,
    ),
  }),
);

// ============================================
// TypeScript Types (Inferred from Schema)
// ============================================

// Dify chat types
export type Thread = typeof threads.$inferSelect;
export type NewThread = typeof threads.$inferInsert;

// Vercel chat types
export type VercelConversation = typeof vercelConversations.$inferSelect;
export type NewVercelConversation = typeof vercelConversations.$inferInsert;

export type VercelMessage = typeof vercelMessages.$inferSelect;
export type NewVercelMessage = typeof vercelMessages.$inferInsert;

export type Mem0Memory = typeof mem0Memories.$inferSelect;
export type NewMem0Memory = typeof mem0Memories.$inferInsert;

export type MemoryExtractionJob = typeof memoryExtractionJobs.$inferSelect;
export type NewMemoryExtractionJob = typeof memoryExtractionJobs.$inferInsert;
```

---

## API Design

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat/vercel` | Send message, receive streaming response |
| `GET` | `/api/chat/vercel/conversations` | List user's conversations |
| `GET` | `/api/chat/vercel/conversations/[id]` | Get conversation with messages |
| `DELETE` | `/api/chat/vercel/conversations/[id]` | Delete conversation |
| `PATCH` | `/api/chat/vercel/conversations/[id]` | Update conversation (title, archive) |
| `GET` | `/api/chat/vercel/memories` | List user's memories (if Mem0 enabled) |
| `DELETE` | `/api/chat/vercel/memories/[id]` | Delete a memory |

### Chat API Pattern

```typescript
// POST /api/chat/vercel
// Request body:
{
  "message": "string",           // User's message
  "conversationId": "uuid?",     // Existing conversation (optional)
  "model": "string?",            // Override default model (optional)
  "systemPrompt": "string?"      // Override system prompt (optional)
}

// Response: Server-Sent Events stream
// Event format matches Vercel AI SDK useChat expectations
data: {"id":"msg-1","role":"assistant","content":"Hello","createdAt":"..."}
data: {"id":"msg-1","role":"assistant","content":"Hello, how","createdAt":"..."}
data: [DONE]
```

---

## Integration Patterns

### Vercel AI SDK Setup

```typescript
// src/libs/ai/client.ts
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

// Provider factory - swappable via env var
export function getModelProvider(model?: string) {
  const defaultModel = process.env.DEFAULT_AI_MODEL || 'gpt-4o';
  const provider = process.env.AI_PROVIDER || 'openai';

  const modelId = model || defaultModel;

  switch (provider) {
    case 'anthropic':
      return anthropic(modelId);
    case 'openai':
    default:
      return openai(modelId);
  }
}
```

### LangFuse Integration

```typescript
// src/libs/langfuse/client.ts
import { Langfuse } from 'langfuse';

export const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL, // Optional: self-hosted
});

// Trace wrapper for AI calls
export function createTrace(userId: string, conversationId: string) {
  return langfuse.trace({
    name: 'chat-vercel',
    userId,
    sessionId: conversationId,
    metadata: {
      provider: process.env.AI_PROVIDER || 'openai',
    },
  });
}
```

### Mem0 Integration (Opt-in)

```typescript
// src/libs/mem0/client.ts
import { MemoryClient } from 'mem0ai';

// Only initialize if enabled
export const mem0Client = process.env.ENABLE_MEM0 === 'true'
  ? new MemoryClient({ apiKey: process.env.MEM0_API_KEY })
  : null;

// Add memory from conversation
export async function extractMemories(
  userId: string,
  conversationId: string,
  messages: Array<{ role: string; content: string }>
) {
  if (!mem0Client) return [];

  // Extract memories from conversation
  const result = await mem0Client.add(messages, {
    user_id: userId,
    metadata: { conversationId },
  });

  return result.memories;
}

// Get relevant memories for context injection
export async function getRelevantMemories(
  userId: string,
  query: string,
  limit = 5
) {
  if (!mem0Client) return [];

  const memories = await mem0Client.search(query, {
    user_id: userId,
    limit,
  });

  return memories;
}
```

### Async Memory Extraction Pattern

```typescript
// src/libs/mem0/extraction-worker.ts

/**
 * Memory extraction runs asynchronously after conversation completes
 * Pattern: Fire-and-forget from chat handler, process via cron/queue
 */
export async function queueMemoryExtraction(
  conversationId: string,
  userId: string
) {
  // Insert job into queue table
  await db.insert(memoryExtractionJobs).values({
    conversationId,
    userId,
    status: 'pending',
  });
}

/**
 * Process pending extraction jobs
 * Called by: Vercel Cron, external worker, or triggered endpoint
 */
export async function processMemoryExtractionJobs() {
  // Get pending jobs (oldest first, limit batch size)
  const jobs = await db
    .select()
    .from(memoryExtractionJobs)
    .where(eq(memoryExtractionJobs.status, 'pending'))
    .orderBy(memoryExtractionJobs.createdAt)
    .limit(10);

  for (const job of jobs) {
    try {
      // Mark as processing
      await db
        .update(memoryExtractionJobs)
        .set({ status: 'processing', startedAt: new Date() })
        .where(eq(memoryExtractionJobs.id, job.id));

      // Get conversation messages
      const messages = await db
        .select()
        .from(vercelMessages)
        .where(eq(vercelMessages.conversationId, job.conversationId))
        .orderBy(vercelMessages.createdAt);

      // Extract memories via Mem0
      const memories = await extractMemories(
        job.userId,
        job.conversationId,
        messages.map(m => ({ role: m.role, content: m.content }))
      );

      // Store memories in local DB
      for (const memory of memories) {
        await db.insert(mem0Memories).values({
          userId: job.userId,
          mem0Id: memory.id,
          content: memory.memory,
          sourceConversationId: job.conversationId,
          metadata: { extractedAt: new Date().toISOString() },
        });
      }

      // Mark job complete
      await db
        .update(memoryExtractionJobs)
        .set({
          status: 'completed',
          completedAt: new Date(),
          messagesProcessed: messages.length,
          memoriesExtracted: memories.length,
        })
        .where(eq(memoryExtractionJobs.id, job.id));

    } catch (error) {
      // Mark job failed
      await db
        .update(memoryExtractionJobs)
        .set({
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date(),
        })
        .where(eq(memoryExtractionJobs.id, job.id));
    }
  }
}
```

---

## Environment Variables

```bash
# Required for Vercel AI SDK Chat
OPENAI_API_KEY=sk-...                    # OpenAI API key (or other provider)
AI_PROVIDER=openai                        # 'openai' | 'anthropic' | 'google'
DEFAULT_AI_MODEL=gpt-4o                   # Default model to use

# Required for LangFuse (observability)
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_SECRET_KEY=sk-...
LANGFUSE_BASE_URL=                        # Optional: self-hosted URL

# Optional: Mem0 (memory feature - opt-in)
ENABLE_MEM0=false                         # Set to 'true' to enable
MEM0_API_KEY=m0-...                       # Mem0 API key (if enabled)
```

---

## Feature Flags

| Flag | Default | Description |
|------|---------|-------------|
| `ENABLE_MEM0` | `false` | Enable Mem0 memory extraction |
| `AI_PROVIDER` | `openai` | LLM provider selection |
| `DEFAULT_AI_MODEL` | `gpt-4o` | Default model for new conversations |

---

## Cost Considerations

| Component | Cost Driver | Mitigation |
|-----------|-------------|------------|
| **OpenAI API** | Per-token pricing | Track `tokenCount` per message, set limits |
| **Mem0** | Per-extraction call | Opt-in only, batch processing, rate limit jobs |
| **LangFuse** | Events/traces | Free tier generous (50k/month), self-host option |

**Recommendation:** Add token usage dashboard in admin panel for cost monitoring.

---

## Migration Path

### From Dify to Vercel AI SDK

Template users who want to migrate from Dify:

1. Export conversation history from Dify (if needed)
2. Remove Dify environment variables
3. Configure Vercel AI SDK environment variables
4. Remove `/chat/dify` route (or keep both)

### Removal Guide

To remove Vercel AI SDK chat entirely:

1. Delete `src/app/[locale]/(chat)/chat/vercel/`
2. Delete `src/app/api/chat/vercel/`
3. Delete `src/libs/ai/`, `src/libs/langfuse/`, `src/libs/mem0/`
4. Remove schema tables from `src/models/Schema.ts`
5. Run `npm run db:generate` to create removal migration
6. Remove environment variables from `.env.example`

---

## Related Documents

- [Epic 10: AI Chat Integration (Dify)](../epics/epic-10-ai-chat-integration-example-module.md)
- [Core Architectural Decisions](./core-architectural-decisions.md)
- [Implementation Patterns](./implementation-patterns-consistency-rules.md)
