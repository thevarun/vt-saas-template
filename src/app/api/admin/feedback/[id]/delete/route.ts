import { eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { feedback } from '@/models/Schema';

import { createFeedbackAction } from '../feedbackAction';

/**
 * POST /api/admin/feedback/[id]/delete
 *
 * Permanently deletes a feedback entry.
 * Requires admin authentication.
 */
export const POST = createFeedbackAction({
  action: 'feedback_delete',
  endpoint: '/api/admin/feedback/[id]/delete',
  execute: id => db.delete(feedback).where(eq(feedback.id, id)),
});
