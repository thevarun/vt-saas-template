import { and, count, desc, eq, gte, lte } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { createAdminClient } from '@/libs/supabase/admin';
import { adminAuditLog } from '@/models/Schema';

export type AuditLogFilters = {
  action?: string;
  adminId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
};

export type AuditLogEntry = {
  id: string;
  adminId: string;
  adminEmail?: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

function buildWhereConditions(filters: AuditLogFilters) {
  const conditions = [];
  if (filters.action) {
    conditions.push(eq(adminAuditLog.action, filters.action));
  }
  if (filters.adminId) {
    conditions.push(eq(adminAuditLog.adminId, filters.adminId));
  }
  if (filters.startDate) {
    conditions.push(gte(adminAuditLog.createdAt, filters.startDate));
  }
  if (filters.endDate) {
    conditions.push(lte(adminAuditLog.createdAt, filters.endDate));
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Fetches audit log entries with optional filtering and pagination.
 * Enriches entries with admin email from Supabase auth.
 */
export async function getAuditLogs(
  filters: AuditLogFilters = {},
): Promise<AuditLogEntry[] | null> {
  try {
    const { limit = 50, offset = 0 } = filters;

    const logs = await db
      .select()
      .from(adminAuditLog)
      .where(buildWhereConditions(filters))
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(limit)
      .offset(offset);

    // Batch lookup: collect unique admin IDs, then resolve emails in parallel
    const supabaseAdmin = createAdminClient();
    const uniqueAdminIds = [...new Set(logs.map(log => log.adminId))];

    const adminEmailMap = new Map<string, string | undefined>();
    await Promise.all(
      uniqueAdminIds.map(async (adminId) => {
        try {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(adminId);
          adminEmailMap.set(adminId, userData?.user?.email ?? undefined);
        } catch {
          adminEmailMap.set(adminId, undefined);
        }
      }),
    );

    const enrichedLogs: AuditLogEntry[] = logs.map(log => ({
      ...log,
      metadata: log.metadata as Record<string, unknown> | null,
      createdAt: log.createdAt,
      adminEmail: adminEmailMap.get(log.adminId),
    }));

    return enrichedLogs;
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return null;
  }
}

/**
 * Returns the total count of audit log entries matching the given filters.
 * Used for pagination calculations.
 */
export async function getAuditLogCount(
  filters: AuditLogFilters = {},
): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(adminAuditLog)
      .where(buildWhereConditions(filters));

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Failed to count audit logs:', error);
    return 0;
  }
}
