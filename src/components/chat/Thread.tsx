'use client';

import {
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from '@assistant-ui/react';
import type { FC } from 'react';

import { EmptyThreadState } from './EmptyThreadState';

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
  <MessagePrimitive.Root className="mb-4 flex justify-end" data-message-role="user">
    <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-primary-foreground shadow-sm md:max-w-[70%]">
      <MessagePrimitive.Content />
    </div>
  </MessagePrimitive.Root>
);

const AssistantMessage: FC = () => (
  <MessagePrimitive.Root
    className="mb-4 flex justify-start"
    data-message-role="assistant"
  >
    <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 shadow-sm md:max-w-[70%]">
      <MessagePrimitive.Content />
    </div>
  </MessagePrimitive.Root>
);

export const Thread: FC<ThreadProps> = ({ className }) => {
  return (
    <ThreadPrimitive.Root
      className={className}
      style={{ ['--thread-max-width' as string]: '880px' }}
    >
      <ThreadPrimitive.Viewport className="relative flex h-full flex-col overflow-y-auto px-3 py-4 sm:px-4 sm:py-6">
        <ThreadPrimitive.Empty>
          <EmptyThreadState />
        </ThreadPrimitive.Empty>
        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            AssistantMessage,
          }}
        />

        <ThreadPrimitive.ViewportFooter className="sticky bottom-0 left-0 mt-auto flex w-full justify-center border-t bg-gradient-to-t from-background/95 via-background/85 to-transparent pb-3 pt-4 backdrop-blur">
          <div className="flex w-full max-w-[var(--thread-max-width)] flex-col items-center gap-2 px-1">
            <ComposerPrimitive.Root className="flex w-full items-end gap-2 rounded-2xl border bg-background px-3 py-2 shadow-sm ring-1 ring-muted/60 transition focus-within:ring-primary/60 hover:-translate-y-px hover:shadow-md sm:px-4 sm:py-3">
              <ComposerPrimitive.Input
                data-testid="composer-input"
                placeholder="Send a message..."
                className="max-h-40 flex-1 resize-none border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground sm:text-base"
                rows={1}
              />
              <ComposerPrimitive.Send className="inline-flex items-center justify-center rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground">
                Send
              </ComposerPrimitive.Send>
            </ComposerPrimitive.Root>

            <ThreadPrimitive.ScrollToBottom className="inline-flex items-center gap-1 rounded-full border bg-background/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition hover:-translate-y-px hover:shadow-md">
              Jump to latest
            </ThreadPrimitive.ScrollToBottom>
          </div>
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};
