'use client';

import * as Sentry from '@sentry/nextjs';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

/**
 * Root Locale Error Boundary
 *
 * Catches errors in all routes under the locale directory.
 * Acts as a fallback before global-error.tsx.
 *
 * Provides:
 * - User-friendly error UI with branded styling
 * - "Try Again" button to reset the error boundary
 * - "Go to Homepage" link for navigation escape
 * - Sentry error logging with context
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Sentry with context
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'locale-root',
        digest: error.digest,
      },
      contexts: {
        errorBoundary: {
          location: 'locale-root',
          digest: error.digest,
        },
      },
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/15 p-3">
            <AlertCircle className="size-8 text-destructive" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Something Went Wrong
          </h1>
          <p className="text-muted-foreground">
            We encountered an unexpected error. Please try again or return to the homepage.
          </p>
        </div>

        {/* Development-only error details */}
        {process.env.NODE_ENV === 'development' && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-left">
            <p className="text-sm font-medium text-destructive">
              Development Error Details:
            </p>
            <p className="mt-2 font-mono text-xs text-destructive/80">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-1 text-xs text-muted-foreground">
                Error ID:
                {' '}
                {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            size="lg"
            className="w-full sm:w-auto"
          >
            Try Again
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            <Link href="/">Go to Homepage</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
