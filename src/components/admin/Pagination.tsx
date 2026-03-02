'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import { Button } from '@/components/ui/button';

type PaginationProps = {
  'currentPage': number;
  'totalPages': number;
  'labels': {
    previous: string;
    next: string;
    pageInfo: string;
  };
  'data-testid'?: string;
};

/**
 * Reusable URL-based pagination controls.
 */
export function Pagination({ currentPage, totalPages, labels, 'data-testid': testId }: PaginationProps) {
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
    <div className="flex items-center justify-center gap-4" data-testid={testId}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        data-testid="pagination-prev"
      >
        {labels.previous}
      </Button>
      <span className="text-sm text-muted-foreground">
        {labels.pageInfo}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        data-testid="pagination-next"
      >
        {labels.next}
      </Button>
    </div>
  );
}
