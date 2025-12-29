import { MessageSquare } from 'lucide-react';

/**
 * EmptyThreadState Component
 * Displays when user has no threads
 *
 * Acceptance Criteria:
 * - AC #11: Empty state displays "Start your first conversation" when no threads
 */
export function EmptyThreadState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
        <MessageSquare className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold">Start your first conversation</h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Click the "New Thread" button above to begin chatting with your AI health coach.
      </p>
    </div>
  );
}
