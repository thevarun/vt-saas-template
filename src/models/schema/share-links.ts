import { boolean, index, integer, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { vtSaasSchema } from './_db-schema';

// Shareable links table for private share URLs
export const shareableLinks = vtSaasSchema.table(
  'shareable_links',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    token: text('token').notNull().unique(),
    resourceType: text('resource_type').notNull(),
    resourceId: uuid('resource_id').notNull(),
    createdBy: uuid('created_by').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
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
    createdByIdx: index('idx_shareable_links_created_by').on(table.createdBy),
    resourceIdx: index('idx_shareable_links_resource').on(
      table.resourceType,
      table.resourceId,
    ),
  }),
);
