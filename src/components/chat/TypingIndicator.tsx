/**
 * TypingIndicator Component
 * Animated dots indicating assistant is typing
 *
 * Acceptance Criteria:
 * - AC #12: Typing indicator displays during assistant response streaming
 * - Used with AssistantIf running condition
 */
export function TypingIndicator() {
  return (
    <div className="mb-4 flex justify-start">
      <div className="flex max-w-[80%] items-center gap-2 rounded-2xl rounded-tl-sm bg-muted px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          <span
            className="size-2 animate-bounce rounded-full bg-muted-foreground/60"
            style={{ animationDelay: '0ms', animationDuration: '1s' }}
          />
          <span
            className="size-2 animate-bounce rounded-full bg-muted-foreground/60"
            style={{ animationDelay: '150ms', animationDuration: '1s' }}
          />
          <span
            className="size-2 animate-bounce rounded-full bg-muted-foreground/60"
            style={{ animationDelay: '300ms', animationDuration: '1s' }}
          />
        </div>
        <span className="text-sm text-muted-foreground">Assistant is typing...</span>
      </div>
    </div>
  );
}
