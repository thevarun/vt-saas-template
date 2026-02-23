'use client';

import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { AssistantChatTransport, useChatRuntime } from '@assistant-ui/react-ai-sdk';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

import { CardErrorFallback, ErrorBoundary } from '@/components/errors';

import { Thread } from '../Thread';

const DevToolsModal = dynamic(
  () => import('@assistant-ui/react-devtools').then(mod => mod.DevToolsModal),
  { ssr: false },
);

type InitialMessage = {
  id: string;
  role: 'system' | 'user' | 'assistant';
  parts: { type: 'text'; text: string }[];
};

type VercelChatInterfaceProps = {
  conversationId?: string;
  initialMessages?: InitialMessage[];
};

/**
 * VercelChatInterface Component - Internal Implementation
 * Chat interface using Vercel AI SDK with Assistant UI
 *
 * SSE Consumption Pattern: Vercel AI SDK useChatRuntime hook
 * See: docs/patterns/sse-streaming.md for full documentation
 *
 * Key differences from Dify implementation:
 * - Uses useChatRuntime from @assistant-ui/react-ai-sdk (built-in streaming support)
 * - Uses AssistantChatTransport for custom API endpoint
 * - Simpler setup - no custom adapter needed
 * - No custom SSE parsing (handled by Vercel AI SDK)
 *
 * Acceptance Criteria:
 * - AC #1: Chat interface loads without errors for authenticated users
 * - AC #2: User can type messages and click send button
 * - AC #3: Messages display in chronological order (user right, AI left)
 * - AC #4: AI responses stream in real-time with typing indicator
 * - AC #5: Loading states display during response generation
 * - AC #6: Error messages display clearly when requests fail
 * - AC #7: UI is fully responsive on mobile, tablet, and desktop
 */
function VercelChatInterfaceInner({ conversationId, initialMessages }: VercelChatInterfaceProps = {}) {
  // Memoize transport so it's not recreated on every render
  const transport = useMemo(
    () => new AssistantChatTransport({
      api: '/api/chat/vercel',
      body: { conversationId },
    }),
    [conversationId],
  );

  // AC #1, #2, #4: useChatRuntime with AssistantChatTransport
  // This hook automatically handles SSE stream parsing and state updates
  // Messages are streamed token-by-token from the server via SSE
  // See: docs/patterns/sse-streaming.md#vercel-ai-sdk-usechat-hook
  const runtime = useChatRuntime({
    id: conversationId,
    messages: initialMessages,
    transport,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {/* Wrapper with min-h-0 for proper flex overflow scrolling */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* DevTools only in development */}
        {process.env.NODE_ENV === 'development' && <DevToolsModal />}

        {/* AC #6: Error display handled by Thread component */}

        {/* AC #1, #2, #3, #4, #5, #7: Thread component with all chat functionality */}
        <Thread className="min-h-0 flex-1" />
      </div>
    </AssistantRuntimeProvider>
  );
}

/**
 * VercelChatInterface Component - Protected with Error Boundary
 *
 * Wraps the chat interface with an error boundary to catch and handle
 * rendering errors gracefully. Provides user-friendly fallback UI.
 *
 * Protected against:
 * - Component rendering errors
 * - State management errors
 * - Third-party library errors (Assistant UI, Vercel AI SDK)
 */
export function VercelChatInterface(props: VercelChatInterfaceProps) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <CardErrorFallback
          error={error}
          onReset={reset}
          message="Chat interface encountered an error"
        />
      )}
      onError={(error) => {
        console.error('[VercelChatInterface] Error caught by boundary:', error);
        // Error is automatically logged to Sentry by ErrorBoundary
      }}
    >
      <VercelChatInterfaceInner {...props} />
    </ErrorBoundary>
  );
}
