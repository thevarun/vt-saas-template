'use client';

import { Archive } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

// Based on vercel_conversations table from Story 10.3
export type Conversation = {
  id: string;
  userId: string;
  title: string | null;
  lastMessagePreview: string | null;
  created_at: string;
  updated_at: string;
  archived: boolean;
};

type ConversationItemProps = {
  conversation: Conversation;
  onArchive: (conversationId: string) => void;
  onNavigate?: () => void;
  collapsed?: boolean;
};

/**
 * ConversationItem Component
 * Individual conversation row in sidebar
 *
 * Acceptance Criteria:
 * - AC #5: Conversations display with title and last message preview
 * - AC #2: Clicking conversation navigates to /chat/vercel/[conversationId]
 * - AC #2: Active conversation highlighted in sidebar (visual indicator)
 * - AC #5: Archive button per conversation
 */
export function ConversationItem({ conversation, onArchive, onNavigate, collapsed }: ConversationItemProps) {
  const router = useRouter();
  const pathname = usePathname();

  // AC #2: Determine if this conversation is active (matches current URL)
  // Use endsWith to handle locale prefix (pathname = "/en/chat/vercel/abc", not "/chat/vercel/abc")
  const isActive = pathname.endsWith(`/chat/vercel/${conversation.id}`);

  // AC #2: Navigate to conversation on click
  const handleClick = () => {
    router.push(`/chat/vercel/${conversation.id}`);
    onNavigate?.();
  };

  // AC #5: Archive conversation (optimistic update in parent)
  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive(conversation.id);
  };

  return (
    <li>
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
        aria-label={`Open conversation: ${conversation.title || 'New Conversation'}`}
        className={`group flex w-full cursor-pointer items-center justify-between rounded-xl border bg-background p-3 text-left shadow-xs transition hover:-translate-y-px hover:shadow-md ${
          isActive ? 'border-primary/40 ring-1 ring-primary/30' : 'border-transparent'
        } ${collapsed ? 'justify-center p-2' : ''}`}
      >
        <div className="flex min-w-0 flex-col">
          <span className={`truncate text-sm font-semibold ${collapsed ? 'sr-only' : ''}`}>
            {conversation.title || 'New Conversation'}
          </span>
          <span className={`truncate text-xs text-muted-foreground ${collapsed ? 'sr-only' : ''}`}>
            {conversation.lastMessagePreview || 'Start a conversation'}
          </span>
        </div>
        <div
          className={`flex items-center gap-1 opacity-0 transition group-hover:opacity-100 ${collapsed ? 'hidden' : ''}`}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={handleArchive}
            className="size-6 rounded p-1 text-muted-foreground hover:bg-muted"
            aria-label="Archive conversation"
          >
            <Archive className="size-4" />
          </Button>
        </div>
      </div>
    </li>
  );
}
