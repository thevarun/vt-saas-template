import { eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { feedback } from '@/models/Schema';

import { createFeedbackAction } from '../feedbackAction';

/**
 * POST /api/admin/feedback/[id]/archive
 *
 * Archives a feedback entry.
 * Requires admin authentication.
 */
export const POST = createFeedbackAction({
  action: 'feedback_archive',
  endpoint: '/api/admin/feedback/[id]/archive',
  includeResult: true,
  execute: async (id) => {
    const updated = await db.update(feedback).set({
      status: 'archived',
    }).where(eq(feedback.id, id)).returning();
    return updated[0];
  },
});
