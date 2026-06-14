import { index, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { vtSaasSchema } from './_db-schema';

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
