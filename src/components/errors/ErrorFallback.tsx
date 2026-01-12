import { AlertCircle, RefreshCw, X } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

import type { ErrorFallbackProps } from './types';

/**
 * InlineErrorFallback
 *
 * Minimal error fallback for inline component errors.
 * Displays a simple error message with retry button.
 */
export function InlineErrorFallback({ onReset, message }: ErrorFallbackProps) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
      <AlertCircle className="size-4 shrink-0 text-destructive" />
      <span className="flex-1 text-destructive">
        {message || 'Failed to load component'}
      </span>
      <Button
        onClick={onReset}
        variant="ghost"
        size="sm"
        className="h-auto shrink-0 p-1 text-destructive hover:bg-destructive/20 hover:text-destructive"
      >
        <RefreshCw className="size-4" />
      </Button>
    </div>
  );
}

/**
 * CardErrorFallback
 *
 * Error fallback for card/section errors.
 * Displays centered error UI suitable for larger containers.
 */
export function CardErrorFallback({ onReset, message }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
      <div className="rounded-full bg-destructive/15 p-3">
        <AlertCircle className="size-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-destructive">
          {message || 'Component Error'}
        </p>
        <p className="text-sm text-muted-foreground">
          Something went wrong while loading this section.
        </p>
      </div>
      <Button onClick={onReset} size="sm" variant="outline">
        <RefreshCw className="mr-2 size-4" />
        Try Again
      </Button>
    </div>
  );
}

/**
 * ModalErrorFallback
 *
 * Error fallback for modal/dialog errors.
 * Includes dismiss action suitable for overlay contexts.
 */
export function ModalErrorFallback({ onReset, message }: ErrorFallbackProps) {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div className="relative rounded-lg border border-destructive/50 bg-destructive/10 p-6">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-2 rounded-sm p-1 hover:bg-destructive/20"
        aria-label="Dismiss"
      >
        <X className="size-4 text-destructive" />
      </button>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-destructive/15 p-3">
          <AlertCircle className="size-6 text-destructive" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-destructive">
            {message || 'Dialog Error'}
          </p>
          <p className="text-sm text-muted-foreground">
            An error occurred in this dialog.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onReset} size="sm">
            Try Again
          </Button>
          <Button onClick={() => setDismissed(true)} size="sm" variant="outline">
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
