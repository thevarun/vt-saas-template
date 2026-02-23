/**
 * Sanitize chat messages by filtering out roles that should not be user-supplied.
 * Only 'user' and 'assistant' roles are allowed to prevent system prompt injection.
 */

const ALLOWED_ROLES = new Set(['user', 'assistant']);

export function sanitizeMessages(
  messages: Array<{ role: string; content: string }>,
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages.filter(m => ALLOWED_ROLES.has(m.role)) as Array<{ role: 'user' | 'assistant'; content: string }>;
}
