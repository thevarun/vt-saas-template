'use client';

import type { ChatModelAdapter } from '@assistant-ui/react';
import {
  AssistantRuntimeProvider,
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useLocalRuntime,
  useThreadListItem,
} from '@assistant-ui/react';
import { useEffect, useState } from 'react';

import type { DifyStreamEvent } from '@/libs/dify/types';

import { Thread } from './Thread';

type ChatInterfaceProps = {
  className?: string;
};

function IconArchive() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect width="20" height="5" x="2" y="4" rx="1" />
      <path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" />
      <path d="M10 13h4" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 6h18" />
      <path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="size-4 shrink-0"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 012 0v5a1 1 0 11-2 0V9zm1-4a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ThreadListItem() {
  // Assistant-UI provides hooks and primitives for thread controls; using them keeps us within the library.
  const thread = useThreadListItem();

  return (
    <ThreadListItemPrimitive.Root className="group">
      <ThreadListItemPrimitive.Trigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition hover:bg-muted/70 data-[active]:bg-primary/10">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold">
            {thread?.title ?? 'Untitled thread'}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {thread?.title ? 'Active thread' : 'Start a conversation'}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <ThreadListItemPrimitive.Archive className="rounded p-1 text-muted-foreground hover:bg-muted">
            <span className="sr-only">Archive</span>
            <IconArchive />
          </ThreadListItemPrimitive.Archive>
          <ThreadListItemPrimitive.Delete className="rounded p-1 text-muted-foreground hover:bg-muted">
            <span className="sr-only">Delete</span>
            <IconTrash />
          </ThreadListItemPrimitive.Delete>
        </div>
      </ThreadListItemPrimitive.Trigger>
    </ThreadListItemPrimitive.Root>
  );
}

function ThreadList({ error, onDismissError }: { error: string | null; onDismissError: () => void }) {
  return (
    <ThreadListPrimitive.Root className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Chat</p>
          <p className="text-xs text-muted-foreground">Stay aligned across threads.</p>
        </div>
        <ThreadListPrimitive.New className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90">
          New
        </ThreadListPrimitive.New>
      </div>

      {error && (
        <button
          type="button"
          onClick={onDismissError}
          className="mx-4 mt-3 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs text-amber-800 transition hover:bg-amber-100"
        >
          <IconInfo />
          <span>{error}</span>
        </button>
      )}

      <div className="flex-1 overflow-y-auto p-3">
        <ThreadListPrimitive.Items
          components={{
            ThreadListItem,
          }}
        />
      </div>
    </ThreadListPrimitive.Root>
  );
}

/**
 * ChatInterface Component
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
export function ChatInterface({ className }: ChatInterfaceProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Persist conversation ID to localStorage for thread history continuity
  useEffect(() => {
    const stored = localStorage.getItem('dify_conversation_id');
    if (stored) {
      setConversationId(stored);
    }
  }, []);

  useEffect(() => {
    if (conversationId) {
      localStorage.setItem('dify_conversation_id', conversationId);
    }
  }, [conversationId]);

  // Create custom adapter for Dify backend
  const adapter: ChatModelAdapter = {
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
  };

  // Create runtime with custom adapter
  const runtime = useLocalRuntime(adapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className={`flex h-full gap-4 ${className || ''}`}>
        <div className="hidden w-72 shrink-0 flex-col rounded-lg border bg-card shadow-sm lg:flex">
          <ThreadList error={error} onDismissError={() => setError(null)} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col rounded-lg border bg-card shadow-sm">
          {/* AC #6: Error banner */}
          {error && (
            <div className="flex items-center gap-2 border-b border-destructive/50 bg-destructive/15 px-4 py-3 text-destructive">
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
          <Thread className="flex-1" />
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
}
