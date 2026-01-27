import { cn } from '@/utils/Helpers';

/**
 * Skeleton Component - Content placeholder during loading
 *
 * @example Text skeleton (single line)
 * <Skeleton variant="text" className="h-4 w-[250px]" />
 *
 * @example Text skeleton (multiple lines)
 * <div className="space-y-2">
 *   <Skeleton variant="text" className="h-4 w-full" />
 *   <Skeleton variant="text" className="h-4 w-full" />
 *   <Skeleton variant="text" className="h-4 w-3/4" />
 * </div>
 *
 * @example Card skeleton
 * <Skeleton variant="card" className="h-32 w-full" />
 *
 * @example Avatar skeleton
 * <Skeleton variant="avatar" className="size-12" />
 *
 * @example Button skeleton
 * <Skeleton variant="button" className="w-24" />
 *
 * @example Table row skeleton
 * <Skeleton variant="table-row" />
 *
 * @example Custom skeleton
 * <Skeleton className="h-20 w-20 rounded-xl" />
 */

type SkeletonVariant = 'text' | 'card' | 'avatar' | 'button' | 'table-row';

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: SkeletonVariant;
};

function Skeleton({
  variant = 'text',
  className,
  ...props
}: SkeletonProps) {
  const variantStyles: Record<SkeletonVariant, string> = {
    'text': 'h-4 w-full rounded',
    'card': 'h-32 w-full rounded-lg',
    'avatar': 'size-10 rounded-full',
    'button': 'h-10 w-24 rounded-md',
    'table-row': 'h-12 w-full rounded',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-muted/50 dark:bg-muted/30',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
export type { SkeletonProps, SkeletonVariant };
