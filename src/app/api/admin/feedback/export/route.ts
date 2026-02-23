import { NextResponse } from 'next/server';

import { internalError, logApiError } from '@/libs/api/errors';
import { withAdminAuth } from '@/libs/api/middleware';
import { logAdminAction } from '@/libs/audit/logAdminAction';
import type { FeedbackStatus, FeedbackType } from '@/libs/queries/feedback';
import { getFeedbackList } from '@/libs/queries/feedback';

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
export const GET = withAdminAuth(async (request, { user }) => {
  try {
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

    const headers = ['ID', 'Type', 'Status', 'Message', 'Email', 'User ID', 'Created At', 'Reviewed At'];
    const rows = feedbackItems.map(item => [
      escapeCsvField(item.id),
      escapeCsvField(item.type),
      escapeCsvField(item.status),
      escapeCsvField(item.message),
      escapeCsvField(item.userEmail || ''),
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
    logApiError(error, {
      endpoint: '/api/admin/feedback/export',
      method: 'GET',
    });
    return internalError();
  }
});
