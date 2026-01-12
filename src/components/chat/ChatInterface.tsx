'use client';

import type { ChatModelAdapter, ThreadHistoryAdapter } from '@assistant-ui/react';
import { AssistantRuntimeProvider, useLocalRuntime } from '@assistant-ui/react';
import { DevToolsModal } from '@assistant-ui/react-devtools';
import { useEffect, useMemo, useState } from 'react';

import { CardErrorFallback, ErrorBoundary } from '@/components/errors';
import { useToast } from '@/hooks/use-toast';
import type { DifyStreamEvent } from '@/libs/dify/types';

import { Thread } from './Thread';

/**
 * Helper to create a full ThreadMessage for user messages
 * Based on internal fromThreadMessageLike conversion
 */
function createUserMessage(id: string, text: string, createdAt: Date) {
  return {
    id,
    role: 'user' as const,
    content: [{ type: 'text' as const, text }],
    createdAt,
    attachments: [],
    metadata: {
      custom: {},
    },
  };
}

/**
 * Helper to create a full ThreadMessage for assistant messages
 * Based on internal fromThreadMessageLike conversion
 */
function createAssistantMessage(id: string, text: string, createdAt: Date) {
  return {
    id,
    role: 'assistant' as const,
    content: [{ type: 'text' as const, text }],
    createdAt,
    status: { type: 'complete' as const, reason: 'stop' as const },
    metadata: {
      unstable_state: null,
      unstable_annotations: [],
      unstable_data: [],
      custom: {},
      steps: [],
    },
  };
}

type ChatInterfaceProps = {
  threadId?: string;
  conversationId?: string | null;
};

/**
 * ChatInterface Component - Internal Implementation
 * Main chat interface using Assistant-UI's Thread component
 * Connects to /api/chat endpoint with streaming support
 *
 * Acceptance Criteria:
 * - AC #1: Chat interface loads without errors for authenticated users
 * - AC #2: User can type messages and click send button
 * - AC #3: Messages display in chronological order (user right, AI left)
 * - AC #4: AI responses stream in real-time with typing indicator
 * - AC #5: Loading states display during response generation
 * - AC #6: Error messages display clearly when requests fail
 * - AC #7: UI is fully responsive on mobile, tablet, and desktop
 * - AC #8: Chat input field auto-focuses on page load
 * - AC #9: Enter key sends message, Shift+Enter adds new line
 */
function ChatInterfaceInner({ threadId, conversationId: initialConversationId }: ChatInterfaceProps = {}) {
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId ?? null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Persist conversation ID to localStorage for thread history continuity (legacy support)
  useEffect(() => {
    // If we have a threadId prop, use the prop conversationId instead of localStorage
    if (threadId) {
      return;
    }

    const stored = localStorage.getItem('dify_conversation_id');
    if (stored) {
      setConversationId(stored);
    }
  }, [threadId]);

  useEffect(() => {
    // Don't persist to localStorage if we're in thread mode
    if (threadId) {
      return;
    }

    if (conversationId) {
      localStorage.setItem('dify_conversation_id', conversationId);
    }
  }, [conversationId, threadId]);

  // Create custom adapter for Dify backend (stable reference)
  const adapter = useMemo<ChatModelAdapter>(() => ({
    async *run({ messages, abortSignal }) {
      try {
        setError(null);

        // Get the last user message
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage || lastMessage.role !== 'user') {
          throw new Error('No user message found');
        }

        // Extract text content from message
        const textParts = lastMessage.content.filter(part => part.type === 'text');
        const messageContent = textParts.map(part => part.text).join('');

        // Call our Dify proxy API
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageContent,
            conversationId,
          }),
          signal: abortSignal,
        });

        // AC #6: Handle errors
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send message');
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        // AC #4: Stream response using SSE
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) {
              continue;
            }

            const data = line.slice(6);
            if (data === '[DONE]') {
              continue;
            }

            try {
              const event: DifyStreamEvent = JSON.parse(data);

              // Handle different event types
              if (event.event === 'message' && event.answer) {
                // Dify streams partial tokens in successive message events.
                // Append rather than replace so we don't lose earlier chunks (previously showed only last token, e.g. '?').
                fullText += event.answer;
                yield {
                  content: [
                    {
                      type: 'text' as const,
                      text: fullText,
                    },
                  ],
                };
              } else if (event.event === 'message_end') {
                // Store conversation ID for next message
                if (event.conversation_id) {
                  setConversationId(event.conversation_id);

                  // AC #13: Dispatch event for new thread creation (when no threadId prop)
                  // This triggers sidebar refetch to show the new thread
                  if (!threadId) {
                    window.dispatchEvent(new CustomEvent('thread-created'));
                  }
                }

                // AC #4: Update thread metadata after message completes
                if (threadId) {
                  // AC #4.1: Extract last message preview (first 100 chars)
                  const preview = fullText.slice(0, 100);

                  // AC #4.2, #4.3, #4.5: PATCH thread metadata, handle errors gracefully
                  fetch(`/api/threads/${threadId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      lastMessagePreview: preview,
                    }),
                  }).catch((err) => {
                    // AC #4.5: Log error, don't block chat
                    console.error('Failed to update thread metadata:', err);
                    // AC #4: Show toast for metadata update failure
                    toast({
                      title: 'Warning',
                      description: 'Failed to update thread preview. Your message was still sent.',
                    });
                  });
                }
              } else if (event.event === 'error') {
                throw new Error(event.message || 'Unknown error from Dify');
              }
            } catch (parseError) {
              console.error('Error parsing SSE event:', parseError);
            }
          }
        }
      } catch (err: any) {
        // AC #6: Display error messages clearly
        const errorMessage = err.message || 'An error occurred';
        setError(errorMessage);
        throw err;
      }
    },
  }), [conversationId, threadId, toast]); // Stable adapter reference

  // Thread history adapter - loads existing messages from Dify
  const historyAdapter = useMemo<ThreadHistoryAdapter | undefined>(() => {
    // Only load history for existing threads with conversation ID
    if (!threadId || !conversationId) {
      return undefined;
    }

    return {
      async load() {
        try {
          const response = await fetch(`/api/chat/messages?conversation_id=${conversationId}`);
          if (!response.ok) {
            console.error('[ChatInterface] Failed to load message history, status:', response.status);
            return { headId: null, messages: [] };
          }

          const data = await response.json();

          // Validate response structure
          if (!data.data || !Array.isArray(data.data)) {
            console.error('Invalid message history response:', data);
            return { headId: null, messages: [] };
          }

          // Transform Dify messages to ExportedMessageRepository format
          // This is the internal format expected by repository.import()
          const exportedMessages: Array<{
            message: any;
            parentId: string | null;
          }> = [];

          let lastMessageId: string | null = null;

          for (const msg of data.data) {
            // Skip invalid messages
            if (!msg || !msg.id) {
              console.warn('[ChatInterface] Skipping invalid message:', msg);
              continue;
            }

            // Add user message if query exists
            if (msg.query) {
              const userMessageId = `${msg.id}-user`;
              const createdAt = msg.created_at ? new Date(msg.created_at * 1000) : new Date();
              const userMessage = createUserMessage(userMessageId, msg.query, createdAt);

              exportedMessages.push({
                message: userMessage,
                parentId: lastMessageId,
              });
              lastMessageId = userMessageId;
            }

            // Add assistant message only if answer exists and is non-empty
            if (msg.answer) {
              const assistantMessageId = `${msg.id}-assistant`;
              const createdAt = msg.created_at ? new Date(msg.created_at * 1000) : new Date();
              const assistantMessage = createAssistantMessage(assistantMessageId, msg.answer, createdAt);

              exportedMessages.push({
                message: assistantMessage,
                parentId: lastMessageId,
              });
              lastMessageId = assistantMessageId;
            }
          }

          // Return in ExportedMessageRepository format
          return {
            headId: lastMessageId,
            messages: exportedMessages,
          };
        } catch (error) {
          console.error('[ChatInterface] Failed to load conversation history:', error);
          return { headId: null, messages: [] }; // Don't block UI on error
        }
      },

      // Optional: append method for persisting new messages
      // Currently messages are persisted via the /api/chat endpoint's thread persistence
      async append() {
        // No-op: messages are already persisted via the chat endpoint
      },
    };
  }, [threadId, conversationId]);

  // Create runtime with custom adapter and history
  const runtime = useLocalRuntime(adapter, {
    adapters: historyAdapter ? { history: historyAdapter } : undefined,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {/* Wrapper with min-h-0 for proper flex overflow scrolling */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* AC #6.2, #6.3: DevTools only in development */}
        {process.env.NODE_ENV === 'development' && <DevToolsModal />}

        {/* AC #6: Error banner */}
        {error && (
          <div className="flex shrink-0 items-center gap-2 border-b border-destructive/50 bg-destructive/15 px-4 py-3 text-destructive">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-5 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto"
              aria-label="Dismiss error"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}

        {/* AC #1, #2, #3, #4, #5, #7, #8, #9: Thread component with all chat functionality */}
        <Thread className="min-h-0 flex-1" />
      </div>
    </AssistantRuntimeProvider>
  );
}

/**
 * ChatInterface Component - Protected with Error Boundary
 *
 * Wraps the chat interface with an error boundary to catch and handle
 * rendering errors gracefully. Provides user-friendly fallback UI.
 *
 * Protected against:
 * - Component rendering errors
 * - State management errors
 * - Third-party library errors (Assistant UI)
 *
 * Rationale: Chat interface is complex with:
 * - Async operations (streaming, API calls)
 * - Third-party integration (Assistant UI)
 * - State management (conversation history)
 */
export function ChatInterface(props: ChatInterfaceProps) {
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
        console.error('[ChatInterface] Error caught by boundary:', error);
        // Error is automatically logged to Sentry by ErrorBoundary
      }}
    >
      <ChatInterfaceInner {...props} />
    </ErrorBoundary>
  );
}
