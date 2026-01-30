import { inArray } from 'drizzle-orm';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { forbiddenError, internalError, unauthorizedError, validationError } from '@/libs/api/errors';
import { logAdminAction } from '@/libs/audit/logAdminAction';
import { isAdmin } from '@/libs/auth/isAdmin';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
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
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return unauthorizedError();
    }
    if (!isAdmin(user)) {
      return forbiddenError('Admin access required');
    }

    const body = await request.json();
    const parsed = bulkActionSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.errors[0]?.message || 'Invalid request');
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
    console.error('Failed to perform bulk feedback action:', error);
    return internalError();
  }
}
