import { getTranslations } from 'next-intl/server';

import { ExportCsvButton } from '@/components/admin/ExportCsvButton';
import { FeedbackFilters } from '@/components/admin/FeedbackFilters';
import { FeedbackList } from '@/components/admin/FeedbackList';
import { FeedbackPagination } from '@/components/admin/FeedbackPagination';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { FeedbackStatus, FeedbackType } from '@/libs/queries/feedback';
import { getFeedbackCount, getFeedbackList } from '@/libs/queries/feedback';

const ITEMS_PER_PAGE = 20;

const VALID_TYPES = ['bug', 'feature', 'praise'] as const;
const VALID_STATUSES = ['pending', 'reviewed', 'archived'] as const;

/**
 * Admin Feedback Page
 * Server component that fetches feedback with URL-based filtering and pagination.
 */
export default async function FeedbackPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await props.params;
  const searchParams = await props.searchParams;
  const t = await getTranslations({ locale, namespace: 'Admin.Feedback' });

  // Parse filters from URL search params
  const typeParam = typeof searchParams.type === 'string' ? searchParams.type : undefined;
  const statusParam = typeof searchParams.status === 'string' ? searchParams.status : undefined;
  const rawPage = typeof searchParams.page === 'string' ? Number.parseInt(searchParams.page, 10) : 1;
  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  const type = typeParam && VALID_TYPES.includes(typeParam as FeedbackType)
    ? (typeParam as FeedbackType)
    : undefined;
  const status = statusParam && VALID_STATUSES.includes(statusParam as FeedbackStatus)
    ? (statusParam as FeedbackStatus)
    : undefined;

  const offset = (page - 1) * ITEMS_PER_PAGE;

  // Fetch feedback and count in parallel
  const [feedbackList, totalCount] = await Promise.all([
    getFeedbackList({ type, status, limit: ITEMS_PER_PAGE, offset }),
    getFeedbackCount({ type, status }),
  ]);

  const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <ExportCsvButton type={type} status={status} />
      </div>

      <FeedbackFilters />

      <Card>
        <CardHeader>
          <CardTitle>{t('allFeedback')}</CardTitle>
          <CardDescription>
            {t('showingResults', { count: feedbackList?.length || 0, total: totalCount })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeedbackList feedbackItems={feedbackList || []} />
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <FeedbackPagination currentPage={page} totalPages={totalPages} />
      )}
    </div>
  );
}
