'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useToast } from '@/hooks/use-toast';

type ThreadTitleEditorProps = {
  threadId: string;
  initialTitle: string | null;
};

/**
 * ThreadTitleEditor Component
 * Inline editable thread title
 *
 * AC #6: Thread title editable inline (click to edit, blur to save)
 * AC #5.2-5.8: All inline editing behavior
 */
export function ThreadTitleEditor({ threadId, initialTitle }: ThreadTitleEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle || '');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  // AC #5.3: Auto-focus and select all text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // AC #5.4, #5.5, #5.6, #5.7: Save title on blur or Enter
  const handleSave = async () => {
    if (!isEditing) {
      return;
    }

    setIsEditing(false);

    // No change, don't save
    if (title === (initialTitle || '')) {
      return;
    }

    setIsSaving(true);

    try {
      // AC #5.5: PATCH /api/threads/[id] with new title
      const response = await fetch(`/api/threads/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error('Failed to update thread title');
      }

      // AC #5.6: Optimistic update - router will refresh (server components only)
      router.refresh();

      // Notify sidebar to update (client component)
      window.dispatchEvent(new CustomEvent('thread-updated', {
        detail: { threadId, title },
      }));
    } catch (error) {
      // AC #5.7: Revert to original title if PATCH fails
      setTitle(initialTitle || '');
      console.error('Failed to update thread title:', error);
      // AC #4: Show toast for update failure
      toast({
        title: 'Error',
        description: 'Failed to update thread title. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // AC #5.2: Click to enter edit mode
  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  // AC #5.4: Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      // Cancel edit, revert to original
      setTitle(initialTitle || '');
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className="w-full border-b border-primary bg-transparent px-1 py-0.5 text-sm font-medium outline-hidden transition-colors disabled:opacity-50"
        placeholder="Untitled Conversation"
      />
    );
  }

  // AC #5.8: Show placeholder if title is null
  const displayTitle = title || 'Untitled Conversation';

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full cursor-text truncate px-1 py-0.5 text-left text-sm font-medium transition-colors hover:text-primary"
      title={displayTitle}
    >
      {displayTitle}
    </button>
  );
}
