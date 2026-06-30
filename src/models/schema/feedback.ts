import { index, pgEnum, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { vtSaasSchema } from './_db-schema';

// Feedback enums — global pgEnum (migration 0000 declares CREATE TYPE "public"."feedback_type")
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
