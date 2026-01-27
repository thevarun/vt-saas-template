import { Skeleton } from './skeleton';

/**
 * LoadingCard Component - Composite loading placeholder for card-based content
 *
 * @example Basic usage
 * <LoadingCard />
 *
 * @example Multiple loading cards
 * <div className="space-y-4">
 *   <LoadingCard />
 *   <LoadingCard />
 *   <LoadingCard />
 * </div>
 *
 * @example Grid layout
 * <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
 *   {Array.from({ length: 6 }).map((_, i) => (
 *     <LoadingCard key={i} />
 *   ))}
 * </div>
 *
 * @example Conditional rendering
 * {isLoading ? <LoadingCard /> : <ActualCard data={data} />}
 */

type LoadingCardProps = {
  className?: string;
};

function LoadingCard({ className }: LoadingCardProps) {
  return (
    <div
      className={`space-y-3 rounded-lg border bg-card p-6 ${className || ''}`}
    >
      {/* Header with avatar and title */}
      <div className="flex items-center space-x-4">
        <Skeleton variant="avatar" className="size-12 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="h-4 w-[200px]" />
          <Skeleton variant="text" className="h-3 w-[150px]" />
        </div>
      </div>

      {/* Content body */}
      <div className="space-y-2">
        <Skeleton variant="text" className="h-3 w-full" />
        <Skeleton variant="text" className="h-3 w-full" />
        <Skeleton variant="text" className="h-3 w-4/5" />
      </div>

      {/* Action button */}
      <Skeleton variant="button" className="w-full sm:w-auto" />
    </div>
  );
}

export { LoadingCard };
export type { LoadingCardProps };
