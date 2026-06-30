/**
 * Returns a safe personalized greeting. Falls back to a generic greeting
 * when the name is missing, blank, or looks like an email address —
 * avoids "Hi user@example.com," style regressions.
 */
export function safeGreeting(recipientName?: string): string {
  const trimmed = recipientName?.trim();
  if (!trimmed || trimmed.includes('@')) {
    return 'Hi there,';
  }
  return `Hi ${trimmed},`;
}
