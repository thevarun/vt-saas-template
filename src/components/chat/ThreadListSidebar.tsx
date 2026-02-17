'use client';

import { PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Thread } from '@/libs/supabase/threads';
import { cn } from '@/utils/Helpers';

import { ErrorThreadState } from './ErrorThreadState';
import { ThreadItem } from './ThreadItem';
import { ThreadListSkeleton } from './ThreadListSkeleton';

/**
 * ThreadListSidebar Component
 * Main sidebar component displaying user's conversation threads
 *
 * Acceptance Criteria:
 * - AC #2: ThreadList displays user's threads fetched from GET /api/threads
 * - AC #3: "New Thread" button navigates to /chat/dify (empty composer)
 * - AC #4: Clicking thread navigates to /chat/dify/[threadId]
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
  const { toast } = useToast();

  const fetchThreads = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
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

      // Optimized comparison - only update if data changed (prevents jarring refresh)
      setThreads((prev) => {
        // Quick check: same length?
        if (prev.length !== activeThreads.length) {
          return activeThreads;
        }

        // Check if any thread changed (by ID and updated_at timestamp)
        const hasChanges = activeThreads.some((newThread: Thread, i: number) =>
          prev[i]?.id !== newThread.id
          || prev[i]?.updated_at !== newThread.updated_at
          || prev[i]?.title !== newThread.title,
        );

        return hasChanges ? activeThreads : prev; // No changes = keep prev (no re-render)
      });
    } catch {
      setError('Failed to load threads');
      // AC #4: Show toast for fetch error
      toast({
        title: 'Error',
        description: 'Failed to load threads. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // AC #2: Fetch threads on mount
  useEffect(() => {
    fetchThreads();
  }, []);

  // Refetch when window regains focus (no polling to avoid flickering)
  useEffect(() => {
    const handleFocus = () => {
      fetchThreads(false); // false = don't show loading skeleton
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Listen for thread updates (title edits) and update optimistically
  useEffect(() => {
    const handleThreadUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ threadId: string; title: string }>;
      setThreads(prev => prev.map(thread =>
        thread.id === customEvent.detail.threadId
          ? { ...thread, title: customEvent.detail.title }
          : thread,
      ));
    };

    window.addEventListener('thread-updated', handleThreadUpdate);
    return () => window.removeEventListener('thread-updated', handleThreadUpdate);
  }, []);

  // AC #13: Listen for new thread creation and refetch to show in sidebar
  useEffect(() => {
    const handleThreadCreated = () => {
      // Refetch threads after a short delay to allow server to complete thread creation
      setTimeout(() => {
        fetchThreads(false); // false = don't show loading skeleton
      }, 500);
    };

    window.addEventListener('thread-created', handleThreadCreated);
    return () => window.removeEventListener('thread-created', handleThreadCreated);
  }, []);

  // AC #3: Navigate to new thread (empty composer)
  const handleNewThread = () => {
    router.push('/chat/dify');
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
      toast({
        title: 'Error',
        description: 'Failed to archive thread. Please try again.',
        variant: 'destructive',
      });
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
      <div className={cn(
        'flex items-center border-b px-3 py-2',
        collapsed ? 'justify-center' : 'justify-between gap-2',
      )}
      >
        {!collapsed && (
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-semibold">Chat</p>
            <p className="truncate text-xs text-muted-foreground">Your conversations</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(prev => !prev)}
          className="size-9 shrink-0 rounded-full border bg-background shadow-sm hover:bg-accent"
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

      {/* AC #4: Error state with retry */}
      {error && !loading && (
        <ErrorThreadState
          error={error}
          onRetry={() => fetchThreads()}
        />
      )}

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto pb-3">
        {/* AC #10: Loading state */}
        {loading && <ThreadListSkeleton />}

        {/* AC #11, AC #3: Minimal sidebar empty state (full empty state in main area) */}
        {!loading && !error && threads.length === 0 && (
          <div className="px-3 py-6 text-center">
            <p className="text-xs text-muted-foreground">No conversations yet</p>
          </div>
        )}

        {/* AC #2, AC #10: Thread list with ARIA roles */}
        {!loading && threads.length > 0 && (
          <nav aria-label="Conversation threads">
            <ul className="space-y-1 px-2 pt-2">
              {threads.map(thread => (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  onArchive={handleArchive}
                  onNavigate={onNavigate}
                  collapsed={collapsed}
                />
              ))}
            </ul>
          </nav>
        )}
      </div>
    </aside>
  );
}
