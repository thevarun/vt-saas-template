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
    // Nullable on purpose: supabase/prod-setup.sql adds an ON DELETE SET NULL FK
    // to auth.users so the audit trail survives when the targeted user is deleted.
    // Keeping this nullable here keeps schema-as-code in sync with the live DB —
    // otherwise db:generate on main would emit ALTER COLUMN target_id SET NOT NULL,
    // which breaks every auth.users cascade delete once deployed.
    targetId: uuid('target_id'),
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
