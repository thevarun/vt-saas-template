import { inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { internalError, invalidRequestError, logApiError, validationError } from '@/libs/api/errors';
import { withAdminAuth } from '@/libs/api/middleware';
import { logAdminAction } from '@/libs/audit/logAdminAction';
import { db } from '@/libs/DB';
import { feedback } from '@/models/Schema';

const bulkActionSchema = z.object({
  action: z.enum(['mark-reviewed', 'delete']),
  ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
});

/**
 * POST /api/admin/feedback/bulk
 *
 * Performs bulk actions on feedback entries.
 * Requires admin authentication.
 */
export const POST = withAdminAuth(async (request, { user }) => {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return invalidRequestError('Invalid JSON in request body');
    }

    const parsed = bulkActionSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.issues[0]?.message || 'Invalid request');
    }

    const { action, ids } = parsed.data;

    if (action === 'mark-reviewed') {
      await db.transaction(async (tx) => {
        await tx.update(feedback).set({
          status: 'reviewed',
          reviewedAt: new Date(),
        }).where(inArray(feedback.id, ids));
      });

      void logAdminAction({
        adminId: user.id,
        action: 'feedback_bulk_mark_reviewed',
        targetType: 'feedback',
        targetId: 'bulk',
        metadata: { count: ids.length, ids },
      });
    } else if (action === 'delete') {
      await db.transaction(async (tx) => {
        await tx.delete(feedback).where(inArray(feedback.id, ids));
      });

      void logAdminAction({
        adminId: user.id,
        action: 'feedback_bulk_delete',
        targetType: 'feedback',
        targetId: 'bulk',
        metadata: { count: ids.length, ids },
      });
    }

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    logApiError(error, {
      endpoint: '/api/admin/feedback/bulk',
      method: 'POST',
    });
    return internalError();
  }
});
