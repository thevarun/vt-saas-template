import { X } from 'lucide-react';

import { cn } from '@/utils/Helpers';

type CloseButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function CloseButton({ className, ...props }: CloseButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    >
      <X className="size-4" />
      <span className="sr-only">Close</span>
    </button>
  );
}
