'use client';

import type { ChatModelAdapter } from '@assistant-ui/react';
import { AssistantRuntimeProvider, useLocalRuntime } from '@assistant-ui/react';
import { useEffect, useState } from 'react';

import type { DifyStreamEvent } from '@/libs/dify/types';

import { Thread } from './Thread';

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
export function ChatInterface() {
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
    </AssistantRuntimeProvider>
  );
}
