'use client';

import '@/styles/global.css';

import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { useEffect } from 'react';

/**
 * Global Error Boundary
 *
 * Catches errors in the root layout and provides app-wide fallback.
 * This is the last line of defense for unhandled errors.
 *
 * IMPORTANT: Must include <html> and <body> tags since root layout is broken.
 * Must import global styles explicitly.
 *
 * Features:
 * - Branded error UI with VT SaaS Template styling
 * - Full page reload action
 * - Development error details
 * - Sentry error logging
 */
export default function GlobalError(props: {
  error: Error & { digest?: string };
  params: { locale: string };
}) {
  useEffect(() => {
    // Log to Sentry with global context
    Sentry.captureException(props.error, {
      tags: {
        errorBoundary: 'global',
        digest: props.error.digest,
      },
      contexts: {
        errorBoundary: {
          location: 'global',
          digest: props.error.digest,
        },
      },
    });
  }, [props.error]);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <html lang={props.params.locale}>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-md space-y-6 text-center">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/15 p-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-12 text-destructive"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Something Went Wrong
              </h1>
              <p className="text-muted-foreground">
                {process.env.NODE_ENV === 'development'
                  ? 'A critical error occurred. Check the console for details.'
                  : 'We apologize for the inconvenience. Please reload the application to continue.'}
              </p>
            </div>

            {/* Development-only error details */}
            {process.env.NODE_ENV === 'development' && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-left">
                <p className="text-sm font-medium text-destructive">
                  Global Error Details:
                </p>
                <p className="mt-2 break-all font-mono text-xs text-destructive/80">
                  {props.error.message}
                </p>
                {props.error.digest && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Error Digest:
                    {' '}
                    {props.error.digest}
                  </p>
                )}
                {props.error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-muted-foreground">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 max-h-40 overflow-auto text-xs text-destructive/70">
                      {props.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Production error reference */}
            {process.env.NODE_ENV === 'production' && props.error.digest && (
              <div className="rounded-lg border bg-muted p-3">
                <p className="text-sm text-muted-foreground">
                  Error Reference:
                  {' '}
                  <code className="font-mono text-xs">{props.error.digest}</code>
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleReload}
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                Reload Application
              </button>
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                Go to Homepage
              </Link>
            </div>

            {/* Footer */}
            <div className="pt-4 text-xs text-muted-foreground">
              <p>VT SaaS Template</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
