'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

import { Button } from '@/components/ui/button';

type FeedbackPaginationProps = {
  currentPage: number;
  totalPages: number;
};

/**
 * FeedbackPagination Component
 * URL-based pagination controls for the feedback list.
 */
export function FeedbackPagination({ currentPage, totalPages }: FeedbackPaginationProps) {
  const t = useTranslations('Admin.Feedback');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(page));
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex items-center justify-center gap-4" data-testid="feedback-pagination">
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        data-testid="pagination-prev"
      >
        {t('pagination.previous')}
      </Button>
      <span className="text-sm text-muted-foreground">
        {t('pagination.page', { current: currentPage, total: totalPages })}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        data-testid="pagination-next"
      >
        {t('pagination.next')}
      </Button>
    </div>
  );
}
