'use client';

import { CardErrorFallback } from '@/components/errors';

/**
 * Error Boundary for Vercel Chat Routes
 * Catches and handles errors in /chat/vercel and /chat/vercel/[conversationId] routes
 *
 * Next.js automatically wraps this component in an error boundary.
 * This component receives error and reset props.
 */
export default function VercelChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <CardErrorFallback
        error={error}
        onReset={reset}
        message="Vercel chat encountered an error"
      />
    </div>
  );
}
