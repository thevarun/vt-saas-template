import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { forbiddenError, internalError, unauthorizedError } from '@/libs/api/errors';
import { logAdminAction } from '@/libs/audit/logAdminAction';
import { isAdmin } from '@/libs/auth/isAdmin';
import type { FeedbackStatus, FeedbackType } from '@/libs/queries/feedback';
import { getFeedbackList } from '@/libs/queries/feedback';
import { createClient } from '@/libs/supabase/server';

const VALID_TYPES = ['bug', 'feature', 'praise'] as const;
const VALID_STATUSES = ['pending', 'reviewed', 'archived'] as const;

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * GET /api/admin/feedback/export
 *
 * Exports feedback as CSV with optional type/status filters.
 * Requires admin authentication.
 */
export async function GET(request: NextRequest) {
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

    // Parse filters from URL search params
    const { searchParams } = request.nextUrl;
    const typeParam = searchParams.get('type');
    const statusParam = searchParams.get('status');

    const type = typeParam && (VALID_TYPES as readonly string[]).includes(typeParam)
      ? (typeParam as FeedbackType)
      : undefined;
    const status = statusParam && (VALID_STATUSES as readonly string[]).includes(statusParam)
      ? (statusParam as FeedbackStatus)
      : undefined;

    const feedbackItems = await getFeedbackList({ type, status, limit: 10000 });

    if (!feedbackItems) {
      return internalError('Failed to fetch feedback for export');
    }

    // Build CSV
    const headers = ['ID', 'Type', 'Status', 'Message', 'Email', 'User ID', 'Created At', 'Reviewed At'];
    const rows = feedbackItems.map(item => [
      escapeCsvField(item.id),
      escapeCsvField(item.type),
      escapeCsvField(item.status),
      escapeCsvField(item.message),
      escapeCsvField(item.email || ''),
      escapeCsvField(item.userId || ''),
      escapeCsvField(item.createdAt.toISOString()),
      escapeCsvField(item.reviewedAt ? item.reviewedAt.toISOString() : ''),
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const today = new Date().toISOString().split('T')[0];

    void logAdminAction({
      adminId: user.id,
      action: 'feedback_export',
      targetType: 'feedback',
      targetId: 'export',
      metadata: { type: type || 'all', status: status || 'all', count: feedbackItems.length },
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=feedback-${today}.csv`,
      },
    });
  } catch (error) {
    console.error('Failed to export feedback:', error);
    return internalError();
  }
}
