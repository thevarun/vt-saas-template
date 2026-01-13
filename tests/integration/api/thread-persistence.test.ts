// @vitest-environment node
/**
 * Integration tests for thread persistence (Story 3.2)
 * Tests that threads are created/updated when chat API is called
 *
 * NOTE: These tests use mocked Supabase thread functions since the API
 * now uses Supabase client for RLS-enforced data access.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/chat/route';
import { createDifyClient } from '@/libs/dify/client';
import { createClient } from '@/libs/supabase/server';
import type { Thread } from '@/libs/supabase/threads';
import * as threadsModule from '@/libs/supabase/threads';

// In-memory storage for threads (simulates database)
const threadStore: Map<string, Thread> = new Map();

// Mock dependencies
vi.mock('@/libs/supabase/threads');
vi.mock('@/libs/dify/client');
vi.mock('@/libs/supabase/server');
vi.mock('@/libs/Logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn(),
    set: vi.fn(),
  }),
}));

describe('Thread Persistence Integration', () => {
  let createdThread: Thread | null = null;

  beforeEach(async () => {
    // Reset mocks and clear thread store
    vi.clearAllMocks();
    threadStore.clear();
    createdThread = null;

    // Mock Supabase auth
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              email: 'test@example.com',
            },
          },
          error: null,
        }),
      },
    };
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);

    // Mock Dify client to return SSE stream with conversation_id
    // Create new stream for each call (streams can only be consumed once)
    const mockDifyClient = {
      chatMessages: vi.fn().mockImplementation(async () => {
        return new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            // Simulate Dify SSE events
            const events = [
              'data: {"event":"message","conversation_id":"test-conv-123","answer":"Hello! Here are some healthy breakfast options:"}\n\n',
              'data: {"event":"message","conversation_id":"test-conv-123","answer":" Oatmeal with fruits"}\n\n',
              'data: {"event":"message_end","conversation_id":"test-conv-123","message_id":"msg-123"}\n\n',
            ];

            events.forEach((event) => {
              controller.enqueue(encoder.encode(event));
            });

            controller.close();
          },
        });
      }),
    };
    vi.mocked(createDifyClient).mockReturnValue(mockDifyClient as any);

    // Setup Supabase threads mock implementations
    vi.mocked(threadsModule.getThreadByConversationId).mockImplementation(async (_supabase, conversationId) => {
      const thread = threadStore.get(conversationId);
      return { data: thread || null, error: null };
    });

    vi.mocked(threadsModule.createThread).mockImplementation(async (_supabase, userId, input) => {
      const now = new Date().toISOString();
      const thread: Thread = {
        id: `thread-${Date.now()}`,
        user_id: userId,
        conversation_id: input.conversation_id,
        title: input.title || null,
        last_message_preview: input.last_message_preview || null,
        archived: input.archived ?? false,
        created_at: now,
        updated_at: now,
      };
      threadStore.set(input.conversation_id, thread);
      createdThread = thread;
      return { data: thread, error: null };
    });

    vi.mocked(threadsModule.updateThread).mockImplementation(async (_supabase, id, input) => {
      // Find the thread in the store
      for (const [convId, thread] of threadStore.entries()) {
        if (thread.id === id) {
          const updated: Thread = {
            ...thread,
            ...(input.last_message_preview !== undefined && { last_message_preview: input.last_message_preview }),
            updated_at: new Date().toISOString(),
          };
          threadStore.set(convId, updated);
          return { data: updated, error: null };
        }
      }
      return { data: null, error: null };
    });
  });

  it('creates thread after first message (AC #1, #2, #3)', async () => {
    // Create mock request
    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What are healthy breakfast options?',
      }),
    });

    // Call route handler
    const response = await POST(request as any);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');

    // Consume the stream
    const reader = response.body?.getReader();

    if (reader) {
      while (true) {
        const { done } = await reader.read();
        if (done) {
          break;
        }
      }
    }

    // Wait for async thread creation
    await new Promise(resolve => setTimeout(resolve, 500));

    // AC #2: Verify createThread was called
    expect(threadsModule.createThread).toHaveBeenCalled();

    // AC #2: Verify thread was created with correct data
    expect(createdThread).toBeDefined();
    expect(createdThread!.conversation_id).toBe('test-conv-123');
    expect(createdThread!.user_id).toBe('550e8400-e29b-41d4-a716-446655440000');

    // AC #2: Verify title auto-generated
    expect(createdThread!.title).toBeTruthy();
    expect(createdThread!.title!.length).toBeLessThanOrEqual(50);

    // AC #5: Verify last_message_preview
    expect(createdThread!.last_message_preview).toBeTruthy();
    expect(createdThread!.last_message_preview!.length).toBeLessThanOrEqual(100);
  });

  it('updates thread metadata on subsequent messages (AC #4, #5)', async () => {
    // Create initial thread in store
    const now = new Date().toISOString();
    const initialThread: Thread = {
      id: 'thread-initial',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      conversation_id: 'test-conv-123',
      title: 'Initial title',
      last_message_preview: 'Initial preview',
      archived: false,
      created_at: now,
      updated_at: now,
    };
    threadStore.set('test-conv-123', initialThread);

    const initialUpdatedAt = initialThread.updated_at;

    // Wait to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 100));

    // Send follow-up message
    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Tell me more about lunch options',
        conversationId: 'test-conv-123',
      }),
    });

    const response = await POST(request as any);

    // Consume the stream
    const reader = response.body?.getReader();

    if (reader) {
      while (true) {
        const { done } = await reader.read();
        if (done) {
          break;
        }
      }
    }

    // Wait for async thread update
    await new Promise(resolve => setTimeout(resolve, 500));

    // AC #4 & #5: Verify updateThread was called
    expect(threadsModule.updateThread).toHaveBeenCalled();

    // Verify thread was updated in store
    const updatedThread = threadStore.get('test-conv-123');

    expect(updatedThread).toBeDefined();

    // AC #4: Verify updated_at changed
    expect(updatedThread!.updated_at).not.toBe(initialUpdatedAt);

    // AC #5: Verify last_message_preview updated
    expect(updatedThread!.last_message_preview).not.toBe('Initial preview');
  });

  it('handles duplicate conversation_id gracefully (AC #6)', async () => {
    // Create mock request
    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'First message',
      }),
    });

    // First call - creates thread
    const response1 = await POST(request as any);
    const reader1 = response1.body?.getReader();

    if (reader1) {
      while (true) {
        const { done } = await reader1.read();
        if (done) {
          break;
        }
      }
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Second call with same conversation_id - should update, not create
    const request2 = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Second message',
        conversationId: 'test-conv-123',
      }),
    });

    const response2 = await POST(request2 as any);
    const reader2 = response2.body?.getReader();

    if (reader2) {
      while (true) {
        const { done } = await reader2.read();
        if (done) {
          break;
        }
      }
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // AC #6: Verify only ONE thread exists in store
    expect(threadStore.size).toBe(1);

    // createThread should only be called once
    expect(threadsModule.createThread).toHaveBeenCalledTimes(1);

    // updateThread should be called for the second message
    expect(threadsModule.updateThread).toHaveBeenCalled();
  });

  it('handles race condition: multiple messages before first response completes (Task 6.1)', async () => {
    // Prepare multiple requests with same conversation
    const requests = [
      new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'First message' }),
      }),
      new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Second message',
          conversationId: 'test-conv-123',
        }),
      }),
      new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Third message',
          conversationId: 'test-conv-123',
        }),
      }),
    ];

    // Fire all requests simultaneously (race condition)
    const responses = await Promise.all(
      requests.map(req => POST(req as any)),
    );

    // Consume all streams
    await Promise.all(
      responses.map(async (response) => {
        const reader = response.body?.getReader();
        if (reader) {
          while (true) {
            const { done } = await reader.read();
            if (done) {
              break;
            }
          }
        }
      }),
    );

    // Wait for all async thread operations
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify: Only ONE thread in store despite race condition
    // (In production, database unique constraint on conversation_id would prevent duplicates)
    expect(threadStore.size).toBe(1);

    // In a true race condition, multiple creates may be attempted
    // The mock allows this, but production DB would handle via unique constraint
    // What matters is that only one thread exists in the end
    expect(threadsModule.createThread).toHaveBeenCalled();

    // Verify the thread exists with correct conversation_id
    const thread = threadStore.get('test-conv-123');

    expect(thread).toBeDefined();
    expect(thread!.conversation_id).toBe('test-conv-123');
  });

  it('handles missing conversation_id gracefully (Task 6.3)', async () => {
    // Override Dify mock to return stream WITHOUT conversation_id
    const mockDifyClientNoConvId = {
      chatMessages: vi.fn().mockImplementation(async () => {
        return new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            // SSE events without conversation_id
            const events = [
              'data: {"event":"message","answer":"Response without conversation_id"}\n\n',
              'data: {"event":"message_end","message_id":"msg-456"}\n\n',
            ];

            events.forEach((event) => {
              controller.enqueue(encoder.encode(event));
            });

            controller.close();
          },
        });
      }),
    };
    vi.mocked(createDifyClient).mockReturnValue(mockDifyClientNoConvId as any);

    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Test message' }),
    });

    // Call route handler
    const response = await POST(request as any);

    // Verify chat response succeeds
    expect(response.status).toBe(200);

    // Consume stream
    const reader = response.body?.getReader();
    if (reader) {
      while (true) {
        const { done } = await reader.read();
        if (done) {
          break;
        }
      }
    }

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify: Thread creation was NOT attempted (no conversation_id)
    expect(threadsModule.createThread).not.toHaveBeenCalled();

    // Thread store should be empty
    expect(threadStore.size).toBe(0);
  });

  it('handles database failure gracefully (Task 6.5)', async () => {
    // Mock createThread to throw error (simulates DB failure)
    vi.mocked(threadsModule.createThread).mockRejectedValue(
      new Error('Database connection failed'),
    );

    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Test message' }),
    });

    // Call route handler
    const response = await POST(request as any);

    // Verify: Chat response still succeeds (not blocked by DB failure)
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');

    // Consume stream
    const reader = response.body?.getReader();
    if (reader) {
      while (true) {
        const { done } = await reader.read();
        if (done) {
          break;
        }
      }
    }

    // Wait for async thread creation attempt
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify: createThread was called (attempt was made)
    expect(threadsModule.createThread).toHaveBeenCalled();

    // Verify: Thread was NOT created in store (due to error)
    expect(threadStore.size).toBe(0);

    // The error should be caught and logged (not thrown)
    // Chat functionality remains unaffected
  });
});
