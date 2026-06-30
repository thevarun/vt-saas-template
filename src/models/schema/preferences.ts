import { boolean, index, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { vtSaasSchema } from './_db-schema';

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
