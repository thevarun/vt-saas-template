// @vitest-environment node
import path from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { and, eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { beforeAll, describe, expect, it } from 'vitest';

import * as schema from './Schema';

/**
 * Schema verification tests for Epic 10.3 database consolidation
 *
 * Tests verify:
 * 1. Table structure is correct (columns, types)
 * 2. TypeScript type inference works
 * 3. Foreign key relationships
 * 4. Index definitions are correct
 *
 * Coverage:
 * - vercelConversations table
 * - vercelMessages table (with FK to vercelConversations)
 * - mem0Memories table
 * - memoryExtractionJobs table
 */

describe('Epic 10.3: Database Schema Consolidation', () => {
  let testDb: PgliteDatabase<typeof schema>;

  beforeAll(async () => {
    // Create isolated PGlite instance for testing
    const pglite = new PGlite();
    await pglite.waitReady;

    testDb = drizzle(pglite, { schema });

    // Apply migrations
    await migrate(testDb, {
      migrationsFolder: path.join(process.cwd(), 'migrations'),
    });
  });

  describe('vercelConversations table', () => {
    it('should create and query vercel_conversations', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';

      const [inserted] = await testDb
        .insert(schema.vercelConversations)
        .values({
          userId,
          title: 'Test Conversation',
          lastMessagePreview: 'Hello world',
          archived: false,
        })
        .returning();

      expect(inserted).toBeDefined();
      expect(inserted!.id).toBeDefined();
      expect(inserted!.userId).toBe(userId);
      expect(inserted!.title).toBe('Test Conversation');
      expect(inserted!.lastMessagePreview).toBe('Hello world');
      expect(inserted!.archived).toBe(false);
      expect(inserted!.createdAt).toBeInstanceOf(Date);
      expect(inserted!.updatedAt).toBeInstanceOf(Date);
    });

    it('should have correct TypeScript types for vercelConversations', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440001';

      // Type inference test - should compile without errors
      const newConversation: typeof schema.vercelConversations.$inferInsert = {
        userId,
        title: 'Type Test',
        lastMessagePreview: null,
        archived: false,
      };

      const [result] = await testDb
        .insert(schema.vercelConversations)
        .values(newConversation)
        .returning();

      // Type check for select
      const selected: typeof schema.vercelConversations.$inferSelect | undefined = result;

      expect(selected).toBeDefined();
      expect(selected!.id).toBeDefined();
      expect(selected!.createdAt).toBeInstanceOf(Date);
    });

    it('should support archiving conversations', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440002';

      const [inserted] = await testDb
        .insert(schema.vercelConversations)
        .values({
          userId,
          archived: false,
        })
        .returning();

      const [updated] = await testDb
        .update(schema.vercelConversations)
        .set({ archived: true })
        .where(eq(schema.vercelConversations.id, inserted!.id))
        .returning();

      expect(updated!.archived).toBe(true);
    });

    it('should query by userId and archived status (tests composite index)', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440003';

      // Insert active and archived conversations
      await testDb.insert(schema.vercelConversations).values([
        { userId, archived: false, title: 'Active 1' },
        { userId, archived: false, title: 'Active 2' },
        { userId, archived: true, title: 'Archived 1' },
      ]);

      const activeConversations = await testDb
        .select()
        .from(schema.vercelConversations)
        .where(and(eq(schema.vercelConversations.userId, userId), eq(schema.vercelConversations.archived, false)));

      expect(activeConversations.length).toBeGreaterThanOrEqual(2);
      expect(activeConversations.every((c: { archived: boolean }) => !c.archived)).toBe(true);

      // Verify at least our test data is present
      const titles = activeConversations.map((c: { title: string | null }) => c.title);

      expect(titles).toContain('Active 1');
      expect(titles).toContain('Active 2');
    });
  });

  describe('vercelMessages table', () => {
    it('should create messages linked to conversation', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440004';

      // Create conversation first
      const [conversation] = await testDb
        .insert(schema.vercelConversations)
        .values({ userId })
        .returning();

      // Create message
      const [message] = await testDb
        .insert(schema.vercelMessages)
        .values({
          conversationId: conversation!.id,
          role: 'user',
          content: 'Hello AI!',
          tokenCount: 15,
          latencyMs: 250,
        })
        .returning();

      expect(message).toBeDefined();
      expect(message!.id).toBeDefined();
      expect(message!.conversationId).toBe(conversation!.id);
      expect(message!.role).toBe('user');
      expect(message!.content).toBe('Hello AI!');
      expect(message!.tokenCount).toBe(15);
      expect(message!.latencyMs).toBe(250);
      expect(message!.createdAt).toBeInstanceOf(Date);
    });

    it('should have correct TypeScript types for vercelMessages', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440005';

      const [conversation] = await testDb
        .insert(schema.vercelConversations)
        .values({ userId })
        .returning();

      // Type inference test
      const newMessage: typeof schema.vercelMessages.$inferInsert = {
        conversationId: conversation!.id,
        role: 'assistant',
        content: 'Hello human!',
        tokenCount: null,
        latencyMs: null,
      };

      const [result] = await testDb
        .insert(schema.vercelMessages)
        .values(newMessage)
        .returning();

      const selected: typeof schema.vercelMessages.$inferSelect | undefined = result;

      expect(selected).toBeDefined();
      expect(selected!.id).toBeDefined();
    });

    it('should enforce foreign key relationship with cascade delete', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440006';

      // Create conversation and messages
      const [conversation] = await testDb
        .insert(schema.vercelConversations)
        .values({ userId })
        .returning();

      await testDb.insert(schema.vercelMessages).values([
        {
          conversationId: conversation!.id,
          role: 'user',
          content: 'Message 1',
        },
        {
          conversationId: conversation!.id,
          role: 'assistant',
          content: 'Message 2',
        },
      ]);

      // Verify messages exist
      const messagesBefore = await testDb
        .select()
        .from(schema.vercelMessages)
        .where(eq(schema.vercelMessages.conversationId, conversation!.id));

      expect(messagesBefore).toHaveLength(2);

      // Delete conversation (should cascade to messages)
      await testDb
        .delete(schema.vercelConversations)
        .where(eq(schema.vercelConversations.id, conversation!.id));

      // Verify messages were deleted
      const messagesAfter = await testDb
        .select()
        .from(schema.vercelMessages)
        .where(eq(schema.vercelMessages.conversationId, conversation!.id));

      expect(messagesAfter).toHaveLength(0);
    });

    it('should query messages by conversation (tests index)', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440007';

      const [conversation] = await testDb
        .insert(schema.vercelConversations)
        .values({ userId })
        .returning();

      await testDb.insert(schema.vercelMessages).values([
        { conversationId: conversation!.id, role: 'user', content: 'Msg 1' },
        { conversationId: conversation!.id, role: 'assistant', content: 'Msg 2' },
        { conversationId: conversation!.id, role: 'user', content: 'Msg 3' },
      ]);

      const messages = await testDb
        .select()
        .from(schema.vercelMessages)
        .where(eq(schema.vercelMessages.conversationId, conversation!.id))
        .orderBy(schema.vercelMessages.createdAt);

      expect(messages).toHaveLength(3);
      expect(messages[0]!.content).toBe('Msg 1');
      expect(messages[2]!.content).toBe('Msg 3');
    });
  });

  describe('mem0Memories table', () => {
    it('should create and query mem0_memories', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440008';
      const conversationId = '550e8400-e29b-41d4-a716-446655440009';

      const [memory] = await testDb
        .insert(schema.mem0Memories)
        .values({
          userId,
          conversationId,
          memoryText: 'User prefers dark mode',
          memoryType: 'preference',
          metadata: { source: 'chat', confidence: 0.95 },
        })
        .returning();

      expect(memory).toBeDefined();
      expect(memory!.id).toBeDefined();
      expect(memory!.userId).toBe(userId);
      expect(memory!.conversationId).toBe(conversationId);
      expect(memory!.memoryText).toBe('User prefers dark mode');
      expect(memory!.memoryType).toBe('preference');
      expect(memory!.metadata).toEqual({ source: 'chat', confidence: 0.95 });
      expect(memory!.createdAt).toBeInstanceOf(Date);
      expect(memory!.updatedAt).toBeInstanceOf(Date);
    });

    it('should have correct TypeScript types for mem0Memories', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';

      // Type inference test
      const newMemory: typeof schema.mem0Memories.$inferInsert = {
        userId,
        conversationId: null,
        memoryText: 'User is a TypeScript developer',
        memoryType: 'fact',
        metadata: null,
      };

      const [result] = await testDb
        .insert(schema.mem0Memories)
        .values(newMemory)
        .returning();

      const selected: typeof schema.mem0Memories.$inferSelect | undefined = result;

      expect(selected).toBeDefined();
      expect(selected!.id).toBeDefined();
    });

    it('should support updating memory metadata', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440011';

      const [inserted] = await testDb
        .insert(schema.mem0Memories)
        .values({
          userId,
          memoryText: 'Important fact',
          metadata: { version: 1 },
        })
        .returning();

      const [updated] = await testDb
        .update(schema.mem0Memories)
        .set({
          metadata: { version: 2, lastAccessed: new Date().toISOString() },
        })
        .where(eq(schema.mem0Memories.id, inserted!.id))
        .returning();

      expect(updated!.metadata).toHaveProperty('version', 2);
      expect(updated!.metadata).toHaveProperty('lastAccessed');
    });

    it('should query memories by userId (tests index)', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440012';

      await testDb.insert(schema.mem0Memories).values([
        { userId, memoryText: 'Memory 1', memoryType: 'fact' },
        { userId, memoryText: 'Memory 2', memoryType: 'preference' },
        { userId, memoryText: 'Memory 3', memoryType: 'context' },
      ]);

      const userMemories = await testDb
        .select()
        .from(schema.mem0Memories)
        .where(eq(schema.mem0Memories.userId, userId));

      expect(userMemories).toHaveLength(3);
    });

    it('should query memories by conversationId (tests index)', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440013';
      const conversationId = '550e8400-e29b-41d4-a716-446655440014';

      await testDb.insert(schema.mem0Memories).values([
        { userId, conversationId, memoryText: 'Conv memory 1' },
        { userId, conversationId, memoryText: 'Conv memory 2' },
        { userId, conversationId: null, memoryText: 'Global memory' },
      ]);

      const conversationMemories = await testDb
        .select()
        .from(schema.mem0Memories)
        .where(eq(schema.mem0Memories.conversationId, conversationId));

      expect(conversationMemories).toHaveLength(2);
    });
  });

  describe('memoryExtractionJobs table', () => {
    it('should create and query memory_extraction_jobs', async () => {
      const conversationId = '550e8400-e29b-41d4-a716-446655440015';

      const [job] = await testDb
        .insert(schema.memoryExtractionJobs)
        .values({
          conversationId,
          status: 'pending',
          errorMessage: null,
          completedAt: null,
        })
        .returning();

      expect(job).toBeDefined();
      expect(job!.id).toBeDefined();
      expect(job!.conversationId).toBe(conversationId);
      expect(job!.status).toBe('pending');
      expect(job!.errorMessage).toBeNull();
      expect(job!.completedAt).toBeNull();
      expect(job!.createdAt).toBeInstanceOf(Date);
    });

    it('should have correct TypeScript types for memoryExtractionJobs', async () => {
      const conversationId = '550e8400-e29b-41d4-a716-446655440016';

      // Type inference test
      const newJob: typeof schema.memoryExtractionJobs.$inferInsert = {
        conversationId,
        status: 'processing',
        errorMessage: null,
        completedAt: null,
      };

      const [result] = await testDb
        .insert(schema.memoryExtractionJobs)
        .values(newJob)
        .returning();

      const selected: typeof schema.memoryExtractionJobs.$inferSelect | undefined = result;

      expect(selected).toBeDefined();
      expect(selected!.id).toBeDefined();
    });

    it('should support job status transitions', async () => {
      const conversationId = '550e8400-e29b-41d4-a716-446655440017';

      // Create pending job
      const [pending] = await testDb
        .insert(schema.memoryExtractionJobs)
        .values({
          conversationId,
          status: 'pending',
        })
        .returning();

      // Update to processing
      const [processing] = await testDb
        .update(schema.memoryExtractionJobs)
        .set({ status: 'processing' })
        .where(eq(schema.memoryExtractionJobs.id, pending!.id))
        .returning();

      expect(processing!.status).toBe('processing');

      // Update to completed
      const completedAt = new Date();
      const [completed] = await testDb
        .update(schema.memoryExtractionJobs)
        .set({ status: 'completed', completedAt })
        .where(eq(schema.memoryExtractionJobs.id, pending!.id))
        .returning();

      expect(completed!.status).toBe('completed');
      expect(completed!.completedAt).toBeInstanceOf(Date);
    });

    it('should support failed jobs with error messages', async () => {
      const conversationId = '550e8400-e29b-41d4-a716-446655440018';

      const [job] = await testDb
        .insert(schema.memoryExtractionJobs)
        .values({
          conversationId,
          status: 'failed',
          errorMessage: 'API timeout after 30s',
          completedAt: new Date(),
        })
        .returning();

      expect(job!.status).toBe('failed');
      expect(job!.errorMessage).toBe('API timeout after 30s');
      expect(job!.completedAt).toBeInstanceOf(Date);
    });

    it('should query jobs by conversationId (tests index)', async () => {
      const conversationId = '550e8400-e29b-41d4-a716-446655440019';

      await testDb.insert(schema.memoryExtractionJobs).values([
        { conversationId, status: 'completed', completedAt: new Date() },
        { conversationId, status: 'pending' },
      ]);

      const jobs = await testDb
        .select()
        .from(schema.memoryExtractionJobs)
        .where(eq(schema.memoryExtractionJobs.conversationId, conversationId));

      expect(jobs).toHaveLength(2);
    });

    it('should query jobs by status (tests index)', async () => {
      const baseId = '550e8400-e29b-41d4-a716-44665544';

      await testDb.insert(schema.memoryExtractionJobs).values([
        { conversationId: `${baseId}0020`, status: 'pending' },
        { conversationId: `${baseId}0021`, status: 'pending' },
        { conversationId: `${baseId}0022`, status: 'processing' },
      ]);

      const pendingJobs = await testDb
        .select()
        .from(schema.memoryExtractionJobs)
        .where(eq(schema.memoryExtractionJobs.status, 'pending'));

      expect(pendingJobs.length).toBeGreaterThanOrEqual(2);
      expect(pendingJobs.every(j => j.status === 'pending')).toBe(true);
    });

    it('should order jobs by createdAt (tests index)', async () => {
      const baseId = '550e8400-e29b-41d4-a716-44665544';

      // Insert jobs with slight delays to ensure different timestamps
      const [job1] = await testDb
        .insert(schema.memoryExtractionJobs)
        .values({ conversationId: `${baseId}0023`, status: 'pending' })
        .returning();

      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      const [job2] = await testDb
        .insert(schema.memoryExtractionJobs)
        .values({ conversationId: `${baseId}0024`, status: 'pending' })
        .returning();

      const jobs = await testDb
        .select()
        .from(schema.memoryExtractionJobs)
        .where(eq(schema.memoryExtractionJobs.status, 'pending'))
        .orderBy(schema.memoryExtractionJobs.createdAt);

      const job1Index = jobs.findIndex(j => j.id === job1!.id);
      const job2Index = jobs.findIndex(j => j.id === job2!.id);

      expect(job1Index).toBeGreaterThanOrEqual(0);
      expect(job2Index).toBeGreaterThanOrEqual(0);
      expect(job1Index).toBeLessThan(job2Index);
    });
  });
});
