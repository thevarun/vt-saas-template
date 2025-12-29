'use client';

import { Archive } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import type { Thread } from '@/libs/supabase/threads';

type ThreadItemProps = {
  thread: Thread;
  onArchive: (threadId: string) => void;
  onNavigate?: () => void;
};

/**
 * ThreadItem Component
 * Individual thread row in sidebar
 *
 * Acceptance Criteria:
 * - AC #2: ThreadList displays user's threads fetched from GET /api/threads
 * - AC #4: Clicking thread navigates to /chat/[threadId]
 * - AC #5: Active thread highlighted in sidebar (visual indicator)
 * - AC #6: Archive button per thread (archives thread, removes from sidebar)
 */
export function ThreadItem({ thread, onArchive, onNavigate }: ThreadItemProps) {
  const router = useRouter();
  const pathname = usePathname();

  // AC #5: Determine if this thread is active (matches current URL)
  const isActive = pathname === `/chat/${thread.id}`;

  // AC #4: Navigate to thread on click
  const handleClick = () => {
    router.push(`/chat/${thread.id}`);
    onNavigate?.();
  };

  // AC #6: Archive thread (optimistic update in parent)
  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive(thread.id);
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      role="button"
      tabIndex={0}
      className={`group flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left transition hover:bg-muted/70 ${
        isActive ? 'bg-primary/10' : ''
      }`}
    >
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold">
          {thread.title || 'New Conversation'}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {thread.last_message_preview || 'Start a conversation'}
        </span>
      </div>
      <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleArchive}
          className="size-6 rounded p-1 text-muted-foreground hover:bg-muted"
          aria-label="Archive thread"
        >
          <Archive className="size-4" />
        </Button>
      </div>
    </div>
  );
}
