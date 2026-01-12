'use client';

import * as Sentry from '@sentry/nextjs';
import { MessageCircleX } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

/**
 * Chat Route Error Boundary
 *
 * Isolates errors in the chat interface.
 * Provides specialized fallback for chat-specific context.
 *
 * Features:
 * - Preserves conversation_id in session storage
 * - "Start New Chat" recovery action
 * - "View Dashboard" escape route
 * - Logs chat-specific error context
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();

  useEffect(() => {
    // Retrieve conversation context for logging
    const conversationId = typeof window !== 'undefined'
      ? localStorage.getItem('dify_conversation_id')
      : null;

    // Log error to Sentry with chat-specific context
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'chat-route',
        digest: error.digest,
        locale: String(params.locale),
      },
      contexts: {
        errorBoundary: {
          location: 'chat-route',
          digest: error.digest,
        },
        chat: {
          conversationId: conversationId || 'none',
        },
        route: {
          locale: params.locale,
        },
      },
    });
  }, [error, params.locale]);

  const handleStartNewChat = () => {
    // Clear conversation ID to start fresh
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dify_conversation_id');
    }
    reset();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/15 p-3">
            <MessageCircleX className="size-8 text-destructive" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Chat Error
          </h1>
          <p className="text-muted-foreground">
            The chat interface encountered an error. Your conversation history is safe.
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
            onClick={handleStartNewChat}
            size="lg"
            className="w-full"
          >
            Start New Chat
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={reset}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              Try Again
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="flex-1"
            >
              <Link href={`/${params.locale}/dashboard`}>View Dashboard</Link>
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-sm text-muted-foreground">
          Starting a new chat will clear the current conversation state.
        </p>
      </div>
    </div>
  );
}
