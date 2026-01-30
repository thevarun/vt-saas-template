import { db } from '@/libs/DB';
import { adminAuditLog } from '@/models/Schema';

export type AuditAction
  = | 'suspend_user'
    | 'unsuspend_user'
    | 'delete_user'
    | 'reset_password'
    | 'feedback_mark_reviewed'
    | 'feedback_delete'
    | 'feedback_archive'
    | 'feedback_export'
    | 'feedback_bulk_mark_reviewed'
    | 'feedback_bulk_delete';

export type LogAdminActionParams = {
  action: AuditAction;
  targetType: 'user' | 'feedback';
  targetId: string;
  adminId: string;
  metadata?: {
    reason?: string;
    [key: string]: unknown;
  };
};

/**
 * Logs an admin action to the audit log table.
 * Uses graceful error handling - returns boolean, never throws.
 * Designed for fire-and-forget usage in API routes.
 */
export async function logAdminAction(params: LogAdminActionParams): Promise<boolean> {
  try {
    await db.insert(adminAuditLog).values({
      adminId: params.adminId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: params.metadata || null,
    });

    return true;
  } catch (error) {
    console.error('Failed to log admin action:', error);
    return false;
  }
}
