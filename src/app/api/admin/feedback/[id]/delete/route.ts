import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { internalError, logApiError, notFoundError } from '@/libs/api/errors';
import { withAdminAuth } from '@/libs/api/middleware';
import { logAdminAction } from '@/libs/audit/logAdminAction';
import { db } from '@/libs/DB';
import { feedback } from '@/models/Schema';

/**
 * POST /api/admin/feedback/[id]/delete
 *
 * Permanently deletes a feedback entry.
 * Requires admin authentication.
 */
export const POST = withAdminAuth(async (_request, { user, params }) => {
  try {
    const { id } = params;

    const existing = await db.select().from(feedback).where(eq(feedback.id, id)).limit(1);
    if (!existing || existing.length === 0) {
      return notFoundError('Feedback');
    }

    await db.delete(feedback).where(eq(feedback.id, id));

    void logAdminAction({
      adminId: user.id,
      action: 'feedback_delete',
      targetType: 'feedback',
      targetId: id,
      metadata: { feedbackType: existing[0]!.type },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logApiError(error, {
      endpoint: '/api/admin/feedback/[id]/delete',
      method: 'POST',
    });
    return internalError();
  }
});
