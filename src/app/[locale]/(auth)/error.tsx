'use client';

import * as Sentry from '@sentry/nextjs';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

/**
 * Auth Routes Error Boundary
 *
 * Isolates errors in dashboard and protected pages.
 * Provides context-aware recovery options for authenticated users.
 *
 * Features:
 * - Preserves user session where possible
 * - Provides "Refresh Dashboard" option
 * - Offers navigation to homepage
 * - Sign out option for auth-related errors
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    // Log error to Sentry with auth context
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'auth-routes',
        digest: error.digest,
        locale: String(params.locale),
      },
      contexts: {
        errorBoundary: {
          location: 'auth-routes',
          digest: error.digest,
        },
        route: {
          locale: params.locale,
        },
      },
    });
  }, [error, params.locale]);

  const handleSignOut = () => {
    router.push(`/${params.locale}/sign-out`);
  };

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
            Dashboard Error
          </h1>
          <p className="text-muted-foreground">
            Something went wrong with your dashboard. This could be a temporary issue.
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
        <div className="flex flex-col gap-3">
          <Button
            onClick={reset}
            size="lg"
            className="w-full"
          >
            Refresh Dashboard
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="flex-1"
            >
              <Link href={`/${params.locale}`}>Return to Homepage</Link>
            </Button>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-sm text-muted-foreground">
          If the problem persists, try signing out and back in.
        </p>
      </div>
    </div>
  );
}
