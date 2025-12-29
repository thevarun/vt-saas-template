'use client';

import { PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import type { Thread } from '@/libs/supabase/threads';
import { cn } from '@/utils/Helpers';

import { EmptyThreadState } from './EmptyThreadState';
import { ThreadItem } from './ThreadItem';
import { ThreadListSkeleton } from './ThreadListSkeleton';

/**
 * ThreadListSidebar Component
 * Main sidebar component displaying user's conversation threads
 *
 * Acceptance Criteria:
 * - AC #2: ThreadList displays user's threads fetched from GET /api/threads
 * - AC #3: "New Thread" button navigates to /chat (empty composer)
 * - AC #4: Clicking thread navigates to /chat/[threadId]
 * - AC #5: Active thread highlighted in sidebar (visual indicator)
 * - AC #6: Archive button per thread (archives thread, removes from sidebar)
 * - AC #10: Loading state shows skeletons during thread fetch
 * - AC #11: Empty state displays "Start your first conversation" when no threads
 */
export function ThreadListSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();

  const fetchThreads = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/threads');

      if (!response.ok) {
        throw new Error('Failed to fetch threads');
      }

      const data = await response.json();
      // Filter out archived threads
      const activeThreads = (data.threads || []).filter(
        (thread: Thread) => !thread.archived,
      );
      setThreads(activeThreads);
    } catch {
      setError('Failed to load threads');
    } finally {
      setLoading(false);
    }
  };

  // AC #2: Fetch threads on mount
  useEffect(() => {
    fetchThreads();
  }, []);

  // AC #3: Navigate to new thread (empty composer)
  const handleNewThread = () => {
    router.push('/chat');
    onNavigate?.();
  };

  // AC #6: Archive thread with optimistic update
  const handleArchive = async (threadId: string) => {
    // Optimistically remove from UI
    setThreads(prev => prev.filter(t => t.id !== threadId));

    try {
      const response = await fetch(`/api/threads/${threadId}/archive`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to archive thread');
      }

      // Success - thread is already removed from UI
    } catch {
      // Rollback on error
      setError('Failed to archive thread');
      await fetchThreads(); // Refetch to restore state
    }
  };

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        'group/sidebar relative flex h-full flex-col border-r bg-muted/40 transition-all duration-200',
        collapsed ? 'w-16' : 'w-72',
      )}
    >
      {/* Header with collapse toggle */}
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div
          className={cn(
            'space-y-0.5 transition-opacity duration-150',
            collapsed && 'pointer-events-none opacity-0',
          )}
        >
          <p className="text-sm font-semibold">Chat</p>
          <p className="text-xs text-muted-foreground">Your conversations</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(prev => !prev)}
          className="size-9 rounded-full border bg-background shadow-sm hover:bg-accent"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>

      {/* Primary action: New Thread */}
      <div className="px-3 pt-3">
        <Button
          onClick={handleNewThread}
          variant="outline"
          className={cn(
            'w-full justify-start gap-2 rounded-xl border bg-background text-sm font-medium shadow-sm transition-all hover:-translate-y-[1px] hover:shadow-md',
            collapsed && 'justify-center px-0',
          )}
          aria-label="Start new thread"
        >
          <Plus className="size-4" />
          <span className={cn('truncate', collapsed && 'sr-only')}>New Thread</span>
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-4 mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {error}
        </div>
      )}

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto pb-3">
        {/* AC #10: Loading state */}
        {loading && <ThreadListSkeleton />}

        {/* AC #11: Empty state */}
        {!loading && threads.length === 0 && <EmptyThreadState />}

        {/* AC #2: Thread list */}
        {!loading && threads.length > 0 && (
          <div className="space-y-1 px-2 pt-2">
            {threads.map(thread => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                onArchive={handleArchive}
                onNavigate={onNavigate}
                collapsed={collapsed}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
