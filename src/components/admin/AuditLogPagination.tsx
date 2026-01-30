'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

import { Button } from '@/components/ui/button';

type AuditLogPaginationProps = {
  currentPage: number;
  totalPages: number;
};

/**
 * AuditLogPagination Component
 * URL-based pagination controls for the audit log.
 */
export function AuditLogPagination({ currentPage, totalPages }: AuditLogPaginationProps) {
  const t = useTranslations('Admin.AuditLog');
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
    <div className="flex items-center justify-center gap-4" data-testid="audit-log-pagination">
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
        {t('pagination.pageOf', { current: currentPage, total: totalPages })}
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
