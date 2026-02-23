import { describe, expect, it } from 'vitest';

/**
 * parseSSEEvent is defined inline in src/app/api/chat/route.ts.
 * We extract the logic here for testability.
 */
function parseSSEEvent(chunk: string): Record<string, unknown> | null {
  try {
    const dataMatch = chunk.match(/data: (.+)/);
    if (!dataMatch?.[1]) {
      return null;
    }

    const jsonStr = dataMatch[1].trim();
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

describe('parseSSEEvent', () => {
  it('returns parsed object for valid SSE data', () => {
    const chunk = 'data: {"event":"message","answer":"hello"}';
    const result = parseSSEEvent(chunk);

    expect(result).toEqual({ event: 'message', answer: 'hello' });
  });

  it('returns object with conversation_id', () => {
    const chunk = 'data: {"event":"message","conversation_id":"abc-123","answer":"Hi"}';
    const result = parseSSEEvent(chunk);

    expect(result).toHaveProperty('conversation_id', 'abc-123');
    expect(result).toHaveProperty('answer', 'Hi');
  });

  it('returns null for malformed SSE data', () => {
    const chunk = 'data: {invalid json}';
    const result = parseSSEEvent(chunk);

    expect(result).toBeNull();
  });

  it('returns null for empty string', () => {
    const result = parseSSEEvent('');

    expect(result).toBeNull();
  });

  it('returns null for SSE comment lines', () => {
    const chunk = ': keep-alive';
    const result = parseSSEEvent(chunk);

    expect(result).toBeNull();
  });

  it('returns null for event-only lines without data', () => {
    const chunk = 'event: message';
    const result = parseSSEEvent(chunk);

    expect(result).toBeNull();
  });

  it('handles message_end event correctly', () => {
    const chunk = 'data: {"event":"message_end","metadata":{"usage":{"total_tokens":100}}}';
    const result = parseSSEEvent(chunk);

    expect(result).toHaveProperty('event', 'message_end');
    expect(result).toHaveProperty('metadata');
  });
});
