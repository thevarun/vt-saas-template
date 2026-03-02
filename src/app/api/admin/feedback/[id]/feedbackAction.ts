import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { internalError, invalidRequestError, logApiError, notFoundError } from '@/libs/api/errors';
import { withAdminAuth } from '@/libs/api/middleware';
import type { AuditAction } from '@/libs/audit/logAdminAction';
import { logAdminAction } from '@/libs/audit/logAdminAction';
import { db } from '@/libs/DB';
import { feedback } from '@/models/Schema';
import { isValidUuid } from '@/utils/validation';

type FeedbackActionConfig = {
  action: AuditAction;
  endpoint: string;
  execute: (id: string) => Promise<any>;
  includeResult?: boolean;
};

export function createFeedbackAction(config: FeedbackActionConfig) {
  return withAdminAuth(async (_request, { user, params }) => {
    try {
      const { id } = params;

      if (!isValidUuid(id)) {
        return invalidRequestError('Invalid feedback ID format');
      }

      const existing = await db.select().from(feedback).where(eq(feedback.id, id)).limit(1);
      if (!existing || existing.length === 0) {
        return notFoundError('Feedback');
      }

      const result = await config.execute(id);

      void logAdminAction({
        adminId: user.id,
        action: config.action,
        targetType: 'feedback',
        targetId: id,
        metadata: { feedbackType: existing[0]!.type },
      });

      return NextResponse.json({
        success: true,
        ...(config.includeResult && result ? { feedback: result } : {}),
      });
    } catch (error) {
      logApiError(error, {
        endpoint: config.endpoint,
        method: 'POST',
      });
      return internalError();
    }
  });
}
