// This file defines the structure of your database tables using the Drizzle ORM.

// To modify the database schema:
// 1. Update this file with your desired changes.
// 2. Generate a new migration by running: `npm run db:generate`

// The generated migration file will reflect your schema changes.
// The migration is automatically applied during the next database interaction,
// so there's no need to run it manually or restart the Next.js server.

import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// DEPRECATED: User profiles table in the public schema
// This table is shared across multiple projects. Do not use for this project.
// Use health_companion.user_preferences instead.
export const userProfiles = pgTable(
  'user_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().unique(),
    username: text('username').unique(),
    displayName: text('display_name'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    userIdIdx: index('idx_user_profiles_user_id').on(table.userId),
    usernameIdx: index('idx_user_profiles_username').on(table.username),
  }),
);

// Create dedicated vt_saas schema (consolidates all project tables)
export const vtSaasSchema = pgSchema('vt_saas');

// Threads table for multi-threaded chat conversations (Dify implementation)
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
  table => ({
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

// User preferences table for this project (isolated from public.user_profiles)
export const userPreferences = vtSaasSchema.table(
  'user_preferences',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().unique(),
    username: text('username').unique(),
    displayName: text('display_name'),
    emailNotifications: boolean('email_notifications').default(true).notNull(),
    language: text('language').default('en').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    userIdIdx: index('idx_user_preferences_user_id').on(table.userId),
    usernameIdx: index('idx_user_preferences_username').on(table.username),
  }),
);

// Admin audit log table for tracking admin actions
export const adminAuditLog = vtSaasSchema.table(
  'admin_audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    adminId: uuid('admin_id').notNull(),
    action: text('action').notNull(), // 'suspend_user' | 'unsuspend_user' | 'delete_user' | 'reset_password'
    targetType: text('target_type').notNull(), // 'user'
    targetId: uuid('target_id').notNull(),
    metadata: jsonb('metadata'), // { reason?: string, [key: string]: any }
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    adminIdIdx: index('idx_admin_audit_log_admin_id').on(table.adminId),
    createdAtIdx: index('idx_admin_audit_log_created_at').on(table.createdAt),
    actionCreatedAtIdx: index('idx_admin_audit_log_action_created_at').on(
      table.action,
      table.createdAt,
    ),
  }),
);

// Feedback enums
export const feedbackTypeEnum = pgEnum('feedback_type', ['bug', 'feature', 'praise']);
export const feedbackStatusEnum = pgEnum('feedback_status', ['pending', 'reviewed', 'archived']);

// Feedback table for user feedback collection
export const feedback = vtSaasSchema.table(
  'feedback',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    message: text('message').notNull(),
    type: feedbackTypeEnum('type').notNull(),
    userId: uuid('user_id'), // nullable - for anonymous submissions
    userEmail: text('user_email'), // nullable - for anonymous submissions
    status: feedbackStatusEnum('status').default('pending').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }), // nullable
  },
  table => ({
    userIdIdx: index('idx_feedback_user_id').on(table.userId),
    statusIdx: index('idx_feedback_status').on(table.status),
    createdAtIdx: index('idx_feedback_created_at').on(table.createdAt),
    statusCreatedIdx: index('idx_feedback_status_created').on(table.status, table.createdAt),
  }),
);

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
    conversationId: uuid('conversation_id'),
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
    conversationId: uuid('conversation_id').notNull(),
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
