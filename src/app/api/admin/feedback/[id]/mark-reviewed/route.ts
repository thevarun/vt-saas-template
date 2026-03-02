import { eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { feedback } from '@/models/Schema';

import { createFeedbackAction } from '../feedbackAction';

/**
 * POST /api/admin/feedback/[id]/mark-reviewed
 *
 * Marks a feedback entry as reviewed.
 * Requires admin authentication.
 */
export const POST = createFeedbackAction({
  action: 'feedback_mark_reviewed',
  endpoint: '/api/admin/feedback/[id]/mark-reviewed',
  includeResult: true,
  execute: async (id) => {
    const updated = await db.update(feedback).set({
      status: 'reviewed',
      reviewedAt: new Date(),
    }).where(eq(feedback.id, id)).returning();
    return updated[0];
  },
});
