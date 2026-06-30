import {
  boolean,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { vtSaasSchema } from './_db-schema';

// Vercel AI SDK conversations table (parallel to Dify threads)
export const vercelConversations = vtSaasSchema.table(
  'vercel_conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
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
  table => ({
    userIdIdx: index('idx_vercel_conversations_user_id').on(table.userId),
    userArchivedIdx: index('idx_vercel_conversations_user_archived').on(
      table.userId,
      table.archived,
    ),
  }),
);

// Vercel AI SDK messages table
export const vercelMessages = vtSaasSchema.table(
  'vercel_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => vercelConversations.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // 'user' | 'assistant' | 'system'
    content: text('content').notNull(),
    tokenCount: integer('token_count'),
    latencyMs: integer('latency_ms'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    conversationIdIdx: index('idx_vercel_messages_conversation_id').on(
      table.conversationId,
    ),
    createdAtIdx: index('idx_vercel_messages_created_at').on(table.createdAt),
  }),
);

// Mem0 memories table for extracted facts/preferences
export const mem0Memories = vtSaasSchema.table(
  'mem0_memories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    conversationId: uuid('conversation_id')
      .references(() => vercelConversations.id, { onDelete: 'set null' }),
    memoryText: text('memory_text').notNull(),
    memoryType: text('memory_type'), // 'fact' | 'preference' | 'context'
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    userIdIdx: index('idx_mem0_memories_user_id').on(table.userId),
    conversationIdIdx: index('idx_mem0_memories_conversation_id').on(
      table.conversationId,
    ),
  }),
);

// Memory extraction jobs table for async processing
export const memoryExtractionJobs = vtSaasSchema.table(
  'memory_extraction_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => vercelConversations.id, { onDelete: 'cascade' }),
    status: text('status').notNull(), // 'pending' | 'processing' | 'completed' | 'failed'
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  table => ({
    conversationIdIdx: index('idx_memory_jobs_conversation_id').on(
      table.conversationId,
    ),
    statusIdx: index('idx_memory_jobs_status').on(table.status),
    createdAtIdx: index('idx_memory_jobs_created_at').on(table.createdAt),
  }),
);
