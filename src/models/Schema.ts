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
export const adminAuditLog = healthCompanionSchema.table(
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
export const feedback = healthCompanionSchema.table(
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

// Shareable links table for private share URLs
export const shareableLinks = healthCompanionSchema.table(
  'shareable_links',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    token: text('token').notNull().unique(), // crypto.randomUUID() or nanoid
    resourceType: text('resource_type').notNull(), // e.g., 'report', 'document'
    resourceId: uuid('resource_id').notNull(),
    createdBy: uuid('created_by').notNull(), // Supabase user ID
    expiresAt: timestamp('expires_at', { withTimezone: true }), // null = never
    accessCount: integer('access_count').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    tokenIdx: index('idx_shareable_links_token').on(table.token),
    createdByIdx: index('idx_shareable_links_created_by').on(table.createdBy),
    resourceIdx: index('idx_shareable_links_resource').on(
      table.resourceType,
      table.resourceId,
    ),
  }),
);
