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

// Create dedicated health_companion schema
export const healthCompanionSchema = pgSchema('health_companion');

// Threads table for multi-threaded chat conversations
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
export const userPreferences = healthCompanionSchema.table(
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
export const adminAuditLog = pgTable(
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

// Feedback enums and table for user feedback management
export const feedbackTypeEnum = pgEnum('feedback_type', ['bug', 'feature', 'praise']);
export const feedbackStatusEnum = pgEnum('feedback_status', ['pending', 'reviewed', 'archived']);

export const feedback = pgTable(
  'feedback',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    type: feedbackTypeEnum('type').notNull(),
    message: text('message').notNull(),
    email: text('email'),
    status: feedbackStatusEnum('status').notNull().default('pending'),
    userId: uuid('user_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  },
  table => ({
    createdAtIdx: index('idx_feedback_created_at').on(table.createdAt),
    typeIdx: index('idx_feedback_type').on(table.type),
    statusIdx: index('idx_feedback_status').on(table.status),
    statusCreatedAtIdx: index('idx_feedback_status_created_at').on(table.status, table.createdAt),
  }),
);
