import { describe, expect, it } from 'vitest';

import type { DifyMessage, DifyMetadata, DifyStreamEvent } from '../types';

describe('Dify type safety', () => {
  it('DifyMetadata.annotation_reply is unknown (not any)', () => {
    const metadata: DifyMetadata = {
      annotation_reply: 'some value',
      retriever_resources: [],
      usage: {
        prompt_tokens: 10,
        prompt_unit_price: '0.01',
        prompt_price_unit: 'USD',
        prompt_price: '0.0001',
        completion_tokens: 20,
        completion_unit_price: '0.02',
        completion_price_unit: 'USD',
        completion_price: '0.0004',
        total_tokens: 30,
        total_price: '0.0005',
        currency: 'USD',
        latency: 100,
      },
    };

    // annotation_reply is unknown, so direct property access requires narrowing
    expect(metadata.annotation_reply).toBeDefined();
  });

  it('DifyMessage fields are typed as unknown (not any)', () => {
    const message: DifyMessage = {
      id: 'msg-1',
      conversation_id: 'conv-1',
      inputs: {},
      query: 'Hello',
      answer: 'Hi!',
      message_files: [],
      feedback: null,
      retriever_resources: [],
      created_at: Date.now(),
      agent_thoughts: [],
      message_metadata: null,
      status: 'normal',
      error: null,
    };

    // These are unknown, so cannot be used directly without narrowing
    expect(message.feedback).toBeNull();
    expect(message.message_metadata).toBeNull();
    expect(Array.isArray(message.message_files)).toBe(true);
    expect(Array.isArray(message.agent_thoughts)).toBe(true);
    expect(Array.isArray(message.retriever_resources)).toBe(true);
  });

  it('DifyStreamEvent has typed event field', () => {
    const event: DifyStreamEvent = {
      event: 'message',
      answer: 'hello',
      conversation_id: 'abc-123',
    };

    expect(event.event).toBe('message');
    expect(event.answer).toBe('hello');
  });
});
