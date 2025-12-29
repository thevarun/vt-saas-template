import { Skeleton } from '@/components/ui/skeleton';

/**
 * ThreadListSkeleton Component
 * Loading skeleton for thread list
 *
 * Acceptance Criteria:
 * - AC #10: Loading state shows skeletons during thread fetch
 */
export function ThreadListSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={`skeleton-${i}`} className="flex items-center justify-between rounded-md px-3 py-2">
          <div className="flex min-w-0 flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="size-6 rounded" />
            <Skeleton className="size-6 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
