import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { forbiddenError, internalError, notFoundError, unauthorizedError } from '@/libs/api/errors';
import { logAdminAction } from '@/libs/audit/logAdminAction';
import { isAdmin } from '@/libs/auth/isAdmin';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { feedback } from '@/models/Schema';

/**
 * POST /api/admin/feedback/[id]/delete
 *
 * Permanently deletes a feedback entry.
 * Requires admin authentication.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    // Verify feedback exists
    const existing = await db.select().from(feedback).where(eq(feedback.id, id)).limit(1);
    if (!existing || existing.length === 0) {
      return notFoundError('Feedback');
    }

    // Delete feedback
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
    console.error('Failed to delete feedback:', error);
    return internalError();
  }
}
