import { Loader2 } from 'lucide-react';

import { cn } from '@/utils/Helpers';

/**
 * Spinner Component - Loading indicator for actions and page loads
 *
 * @example Small spinner (inline)
 * <Spinner size="sm" />
 *
 * @example Medium spinner (default)
 * <Spinner />
 *
 * @example Large spinner (full-page loading)
 * <Spinner size="lg" />
 *
 * @example Button with spinner
 * <Button disabled>
 *   <Spinner size="sm" className="mr-2" />
 *   Loading...
 * </Button>
 *
 * @example Full-page loading
 * <div className="flex min-h-screen items-center justify-center">
 *   <Spinner size="lg" />
 * </div>
 *
 * @example Custom color
 * <Spinner className="text-primary" />
 */

type SpinnerSize = 'sm' | 'md' | 'lg';

type SpinnerProps = {
  size?: SpinnerSize;
  className?: string;
};

function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeMap: Record<SpinnerSize, string> = {
    sm: 'size-4',
    md: 'size-6',
    lg: 'size-12',
  };

  return (
    <Loader2
      className={cn(
        'animate-spin text-muted-foreground',
        sizeMap[size],
        className,
      )}
    />
  );
}

export { Spinner };
export type { SpinnerProps, SpinnerSize };
