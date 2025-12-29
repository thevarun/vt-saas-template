/**
 * Integration tests for thread persistence (Story 3.2)
 * Tests that threads are created/updated when chat API is called
 *
 * NOTE: These tests use mocked Supabase thread functions since the API
 * now uses Supabase client for RLS-enforced data access.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Thread } from '@/libs/supabase/threads';
import * as threadsModule from '@/libs/supabase/threads';

// In-memory storage for threads (simulates database)
const threadStore: Map<string, Thread> = new Map();

// Mock Supabase threads module
vi.mock('@/libs/supabase/threads', () => ({
  getThreadByConversationId: vi.fn(),
  createThread: vi.fn(),
  updateThread: vi.fn(),
}));

// Mock Dify client to avoid real API calls
vi.mock('@/libs/dify/client', () => ({
  createDifyClient: () => ({
    chatMessages: async () => {
      // Return mock SSE stream
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
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

      return stream;
    },
  }),
}));

// Mock Supabase auth to return test user
vi.mock('@/libs/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'test@example.com',
          },
        },
        error: null,
      }),
    },
  }),
}));

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: async () => ({}),
}));

describe('Thread Persistence Integration', () => {
  let createdThread: Thread | null = null;

  beforeEach(async () => {
    // Reset mocks and clear thread store
    vi.clearAllMocks();
    threadStore.clear();
    createdThread = null;

    // Setup mock implementations
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
    // Import route handler
    const { POST } = await import('@/app/api/chat/route');

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

    // Import route handler
    const { POST } = await import('@/app/api/chat/route');

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
    // Import route handler
    const { POST } = await import('@/app/api/chat/route');

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
});
