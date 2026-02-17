'use client';

import { PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/utils/Helpers';

import { ErrorThreadState } from '../ErrorThreadState';
import { ThreadListSkeleton } from '../ThreadListSkeleton';
import type { Conversation } from './ConversationItem';
import { ConversationItem } from './ConversationItem';

/**
 * ConversationListSidebar Component
 * Main sidebar component displaying user's Vercel AI SDK conversations
 *
 * Acceptance Criteria:
 * - AC #5: ConversationList displays user's conversations fetched from GET /api/chat/vercel/conversations
 * - AC #1: "New Conversation" button navigates to /chat/vercel (empty composer)
 * - AC #2: Clicking conversation navigates to /chat/vercel/[conversationId]
 * - AC #2: Active conversation highlighted in sidebar (visual indicator)
 * - AC #5: Archive button per conversation (archives conversation, removes from sidebar)
 * - AC #1: Loading state shows skeletons during conversation fetch
 * - AC #1: Empty state displays "Start your first conversation" when no conversations
 */
export function ConversationListSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const fetchConversations = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const response = await fetch('/api/chat/vercel/conversations');

      if (!response.ok) {
        // AC #6: Graceful degradation if API not ready (Story 10.8 parallel track)
        if (response.status === 404) {
          setError('Conversation management API not available yet');
          setConversations([]);
          return;
        }
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      // Filter out archived conversations
      const activeConversations = (data.conversations || []).filter(
        (conversation: Conversation) => !conversation.archived,
      );

      // Optimized comparison - only update if data changed (prevents jarring refresh)
      setConversations((prev) => {
        // Quick check: same length?
        if (prev.length !== activeConversations.length) {
          return activeConversations;
        }

        // Check if any conversation changed (by ID and updated_at timestamp)
        const hasChanges = activeConversations.some((newConversation: Conversation, i: number) =>
          prev[i]?.id !== newConversation.id
          || prev[i]?.updated_at !== newConversation.updated_at
          || prev[i]?.title !== newConversation.title,
        );

        return hasChanges ? activeConversations : prev; // No changes = keep prev (no re-render)
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversations';
      setError(errorMessage);
      // Show toast for fetch error
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // AC #5: Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Refetch when window regains focus (no polling to avoid flickering)
  useEffect(() => {
    const handleFocus = () => {
      fetchConversations(false); // false = don't show loading skeleton
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Listen for conversation updates and update optimistically
  useEffect(() => {
    const handleConversationUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ conversationId: string; title: string }>;
      setConversations(prev => prev.map(conversation =>
        conversation.id === customEvent.detail.conversationId
          ? { ...conversation, title: customEvent.detail.title }
          : conversation,
      ));
    };

    window.addEventListener('conversation-updated', handleConversationUpdate);
    return () => window.removeEventListener('conversation-updated', handleConversationUpdate);
  }, []);

  // Listen for new conversation creation and refetch to show in sidebar
  useEffect(() => {
    const handleConversationCreated = () => {
      // Refetch conversations after a short delay to allow server to complete conversation creation
      setTimeout(() => {
        fetchConversations(false); // false = don't show loading skeleton
      }, 500);
    };

    window.addEventListener('conversation-created', handleConversationCreated);
    return () => window.removeEventListener('conversation-created', handleConversationCreated);
  }, []);

  // AC #1: Navigate to new conversation (empty composer)
  const handleNewConversation = () => {
    router.push('/chat/vercel');
    onNavigate?.();
  };

  // AC #5: Archive conversation with optimistic update
  const handleArchive = async (conversationId: string) => {
    // Optimistically remove from UI
    setConversations(prev => prev.filter(c => c.id !== conversationId));

    try {
      const response = await fetch(`/api/chat/vercel/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to archive conversation');
      }

      // Success - conversation is already removed from UI
    } catch {
      // Rollback on error
      toast({
        title: 'Error',
        description: 'Failed to archive conversation. Please try again.',
        variant: 'destructive',
      });
      await fetchConversations(); // Refetch to restore state
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
            <p className="text-sm font-semibold">Chat (AI SDK)</p>
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

      {/* Primary action: New Conversation */}
      <div className="px-3 pt-3">
        <Button
          onClick={handleNewConversation}
          variant="outline"
          className={cn(
            'w-full justify-start gap-2 rounded-xl border bg-background text-sm font-medium shadow-sm transition-all hover:-translate-y-[1px] hover:shadow-md',
            collapsed && 'justify-center px-0',
          )}
          aria-label="Start new conversation"
        >
          <Plus className="size-4" />
          <span className={cn('truncate', collapsed && 'sr-only')}>New Conversation</span>
        </Button>
      </div>

      {/* Error state with retry */}
      {error && !loading && (
        <ErrorThreadState
          error={error}
          onRetry={() => fetchConversations()}
        />
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto pb-3">
        {/* AC #1: Loading state */}
        {loading && <ThreadListSkeleton />}

        {/* AC #1: Minimal sidebar empty state (full empty state in main area) */}
        {!loading && !error && conversations.length === 0 && (
          <div className="px-3 py-6 text-center">
            <p className="text-xs text-muted-foreground">No conversations yet</p>
          </div>
        )}

        {/* AC #5: Conversation list with ARIA roles */}
        {!loading && conversations.length > 0 && (
          <nav aria-label="Conversation list">
            <ul className="space-y-1 px-2 pt-2">
              {conversations.map(conversation => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
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
