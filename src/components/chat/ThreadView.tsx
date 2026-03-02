'use client';

import type { Thread } from '@/libs/queries/threads';

import { ChatInterface } from './ChatInterface';
import { ThreadTitleEditor } from './ThreadTitleEditor';

type ThreadViewProps = {
  thread: Thread;
};

/**
 * ThreadView Component
 * Client component that renders chat interface for a specific thread
 * Passes thread data to ChatInterface for conversation context
 *
 * AC #1.3: Pass thread data to ThreadView client component
 */
export function ThreadView({ thread }: ThreadViewProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* AC #6: Thread title editing */}
      <div className="shrink-0 border-b px-4 py-3">
        <ThreadTitleEditor threadId={thread.id} initialTitle={thread.title} />
      </div>

      {/* AC #1.3: Pass thread to ChatInterface */}
      {/* Key forces full remount when navigating between threads, ensuring history reloads */}
      {/* min-h-0 required for flex child to allow overflow scrolling */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ChatInterface key={thread.id} threadId={thread.id} conversationId={thread.conversationId} />
      </div>
    </div>
  );
}
