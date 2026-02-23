import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { internalError, invalidRequestError, logApiError, notFoundError } from '@/libs/api/errors';
import { withAdminAuth } from '@/libs/api/middleware';
import { logAdminAction } from '@/libs/audit/logAdminAction';
import { db } from '@/libs/DB';
import { feedback } from '@/models/Schema';
import { isValidUuid } from '@/utils/validation';

/**
 * POST /api/admin/feedback/[id]/mark-reviewed
 *
 * Marks a feedback entry as reviewed.
 * Requires admin authentication.
 */
export const POST = withAdminAuth(async (_request, { user, params }) => {
  try {
    const { id } = params;

    if (!isValidUuid(id)) {
      return invalidRequestError('Invalid feedback ID format');
    }

    const existing = await db.select().from(feedback).where(eq(feedback.id, id)).limit(1);
    if (!existing || existing.length === 0) {
      return notFoundError('Feedback');
    }

    const updated = await db.update(feedback).set({
      status: 'reviewed',
      reviewedAt: new Date(),
    }).where(eq(feedback.id, id)).returning();

    void logAdminAction({
      adminId: user.id,
      action: 'feedback_mark_reviewed',
      targetType: 'feedback',
      targetId: id,
      metadata: { feedbackType: existing[0]!.type },
    });

    return NextResponse.json({ success: true, feedback: updated[0] });
  } catch (error) {
    logApiError(error, {
      endpoint: '/api/admin/feedback/[id]/mark-reviewed',
      method: 'POST',
    });
    return internalError();
  }
});
