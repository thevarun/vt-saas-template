'use client';

import {
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from '@assistant-ui/react';
import { type FC, useEffect, useRef } from 'react';

/**
 * Thread Component
 * Composable chat thread UI using Assistant-UI primitives
 *
 * Provides:
 * - Message list with auto-scroll
 * - User and assistant message display
 * - Composer (input area) with send button
 * - Loading states and typing indicators
 * - Responsive design (AC #7)
 */

type ThreadProps = {
  className?: string;
};

const UserMessage: FC = () => (
  <div className="mb-4 flex justify-end">
    <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-primary-foreground shadow-sm md:max-w-[70%]">
      <MessagePrimitive.Content />
    </div>
  </div>
);

const AssistantMessage: FC = () => (
  <div className="mb-4 flex justify-start">
    <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 shadow-sm md:max-w-[70%]">
      <MessagePrimitive.Content />
    </div>
  </div>
);

export const Thread: FC<ThreadProps> = ({ className }) => {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Keep composer focused on mount without using the autoFocus attribute for a11y compliance
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <ThreadPrimitive.Root className={className}>
      {/* AC #7: Responsive viewport */}
      <ThreadPrimitive.Viewport className="flex h-full flex-col overflow-y-auto scroll-smooth px-3 py-4 sm:px-4 sm:py-8">
        <ThreadPrimitive.Empty>
          <div className="flex flex-col items-center justify-center py-12 text-center sm:py-16">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted sm:size-16">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-6 text-muted-foreground sm:size-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold sm:text-lg">Welcome to AI Health Coach</h3>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground sm:max-w-sm sm:text-base">
              Start a conversation to get personalized health guidance and support.
            </p>
          </div>
        </ThreadPrimitive.Empty>

        {/* AC #3: Messages display in chronological order */}
        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            AssistantMessage,
          }}
        />
      </ThreadPrimitive.Viewport>

      {/* AC #2, #8, #9: Composer with auto-focus and keyboard shortcuts */}
      <div className="border-t p-3 sm:p-4">
        <ComposerPrimitive.Root className="flex items-end gap-2 rounded-lg border bg-background focus-within:ring-2 focus-within:ring-ring">
          <ComposerPrimitive.Input
            ref={inputRef}
            placeholder="Type your message... (Shift+Enter to send)"
            className="max-h-40 flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground sm:px-4 sm:py-3 sm:text-base"
            rows={1}
            submitOnEnter={false}
          />
          <ComposerPrimitive.Send className="m-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground sm:m-2 sm:px-4 sm:py-2 sm:text-base">
            Send
          </ComposerPrimitive.Send>
        </ComposerPrimitive.Root>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Press Enter for new line, Shift+Enter or click Send to submit
        </p>
      </div>

      <ThreadPrimitive.ScrollToBottom className="fixed bottom-20 right-4 rounded-full border bg-background p-2 shadow-lg sm:bottom-24 sm:right-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="size-4 sm:size-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </ThreadPrimitive.ScrollToBottom>
    </ThreadPrimitive.Root>
  );
};
