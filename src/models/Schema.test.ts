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
 * Schema verification tests for database consolidation + T-008 data layer integrity
 *
 * Tests verify:
 * 1. Table structure is correct (columns, types)
 * 2. TypeScript type inference works
 * 3. Foreign key relationships (including FK on mem0/jobs tables)
 * 4. Index definitions are correct
 */

// Helper: create a conversation and return its id
async function createTestConversation(testDb: PgliteDatabase<typeof schema>, userId: string): Promise<string> {
  const [conv] = await testDb
    .insert(schema.vercelConversations)
    .values({ userId })
    .returning();
  return conv!.id;
}

describe('Database Schema Tests', () => {
  let testDb: PgliteDatabase<typeof schema>;

  beforeAll(async () => {
    const pglite = new PGlite();
    await pglite.waitReady;

    testDb = drizzle(pglite, { schema });

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

      const titles = activeConversations.map((c: { title: string | null }) => c.title);

      expect(titles).toContain('Active 1');
      expect(titles).toContain('Active 2');
    });
  });

  describe('vercelMessages table', () => {
    it('should create messages linked to conversation', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440004';

      const [conversation] = await testDb
        .insert(schema.vercelConversations)
        .values({ userId })
        .returning();

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

      const messagesBefore = await testDb
        .select()
        .from(schema.vercelMessages)
        .where(eq(schema.vercelMessages.conversationId, conversation!.id));

      expect(messagesBefore).toHaveLength(2);

      await testDb
        .delete(schema.vercelConversations)
        .where(eq(schema.vercelConversations.id, conversation!.id));

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
    it('should create memory with valid conversationId (FK reference)', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440008';
      const conversationId = await createTestConversation(testDb, userId);

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

    it('should create memory with null conversationId', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';

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
      expect(selected!.conversationId).toBeNull();
    });

    it('should reject memory with non-existent conversationId (FK violation)', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440030';
      const fakeConversationId = '550e8400-e29b-41d4-a716-446655440099';

      await expect(
        testDb.insert(schema.mem0Memories).values({
          userId,
          conversationId: fakeConversationId,
          memoryText: 'Should fail',
        }),
      ).rejects.toThrow();
    });

    it('should set conversationId to null when conversation is deleted (onDelete: set null)', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440031';
      const conversationId = await createTestConversation(testDb, userId);

      const [memory] = await testDb
        .insert(schema.mem0Memories)
        .values({
          userId,
          conversationId,
          memoryText: 'Memory tied to conversation',
        })
        .returning();

      // Delete conversation
      await testDb
        .delete(schema.vercelConversations)
        .where(eq(schema.vercelConversations.id, conversationId));

      // Memory should still exist but with null conversationId
      const [updatedMemory] = await testDb
        .select()
        .from(schema.mem0Memories)
        .where(eq(schema.mem0Memories.id, memory!.id));

      expect(updatedMemory).toBeDefined();
      expect(updatedMemory!.conversationId).toBeNull();
      expect(updatedMemory!.memoryText).toBe('Memory tied to conversation');
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
      const conversationId = await createTestConversation(testDb, userId);

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
    it('should create job with valid conversationId (FK reference)', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440040';
      const conversationId = await createTestConversation(testDb, userId);

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

    it('should reject job with non-existent conversationId (FK violation)', async () => {
      const fakeConversationId = '550e8400-e29b-41d4-a716-446655440098';

      await expect(
        testDb.insert(schema.memoryExtractionJobs).values({
          conversationId: fakeConversationId,
          status: 'pending',
        }),
      ).rejects.toThrow();
    });

    it('should cascade delete jobs when conversation is deleted (onDelete: cascade)', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440041';
      const conversationId = await createTestConversation(testDb, userId);

      await testDb.insert(schema.memoryExtractionJobs).values([
        { conversationId, status: 'pending' },
        { conversationId, status: 'completed', completedAt: new Date() },
      ]);

      const jobsBefore = await testDb
        .select()
        .from(schema.memoryExtractionJobs)
        .where(eq(schema.memoryExtractionJobs.conversationId, conversationId));

      expect(jobsBefore).toHaveLength(2);

      // Delete conversation -- jobs should cascade
      await testDb
        .delete(schema.vercelConversations)
        .where(eq(schema.vercelConversations.id, conversationId));

      const jobsAfter = await testDb
        .select()
        .from(schema.memoryExtractionJobs)
        .where(eq(schema.memoryExtractionJobs.conversationId, conversationId));

      expect(jobsAfter).toHaveLength(0);
    });

    it('should have correct TypeScript types for memoryExtractionJobs', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440042';
      const conversationId = await createTestConversation(testDb, userId);

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
      const userId = '550e8400-e29b-41d4-a716-446655440043';
      const conversationId = await createTestConversation(testDb, userId);

      const [pending] = await testDb
        .insert(schema.memoryExtractionJobs)
        .values({
          conversationId,
          status: 'pending',
        })
        .returning();

      const [processing] = await testDb
        .update(schema.memoryExtractionJobs)
        .set({ status: 'processing' })
        .where(eq(schema.memoryExtractionJobs.id, pending!.id))
        .returning();

      expect(processing!.status).toBe('processing');

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
      const userId = '550e8400-e29b-41d4-a716-446655440044';
      const conversationId = await createTestConversation(testDb, userId);

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
      const userId = '550e8400-e29b-41d4-a716-446655440045';
      const conversationId = await createTestConversation(testDb, userId);

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
      const baseUserId = '550e8400-e29b-41d4-a716-44665544';

      const conv1Id = await createTestConversation(testDb, `${baseUserId}0046`);
      const conv2Id = await createTestConversation(testDb, `${baseUserId}0047`);
      const conv3Id = await createTestConversation(testDb, `${baseUserId}0048`);

      await testDb.insert(schema.memoryExtractionJobs).values([
        { conversationId: conv1Id, status: 'pending' },
        { conversationId: conv2Id, status: 'pending' },
        { conversationId: conv3Id, status: 'processing' },
      ]);

      const pendingJobs = await testDb
        .select()
        .from(schema.memoryExtractionJobs)
        .where(eq(schema.memoryExtractionJobs.status, 'pending'));

      expect(pendingJobs.length).toBeGreaterThanOrEqual(2);
      expect(pendingJobs.every(j => j.status === 'pending')).toBe(true);
    });

    it('should order jobs by createdAt (tests index)', async () => {
      const baseUserId = '550e8400-e29b-41d4-a716-44665544';

      const conv1Id = await createTestConversation(testDb, `${baseUserId}0049`);
      const conv2Id = await createTestConversation(testDb, `${baseUserId}0050`);

      const [job1] = await testDb
        .insert(schema.memoryExtractionJobs)
        .values({ conversationId: conv1Id, status: 'pending' })
        .returning();

      await new Promise(resolve => setTimeout(resolve, 10));

      const [job2] = await testDb
        .insert(schema.memoryExtractionJobs)
        .values({ conversationId: conv2Id, status: 'pending' })
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

  describe('subscription tables', () => {
    // Helper: seed a tier and return its id.
    async function createTier(
      name: string,
      overrides: Partial<typeof schema.subscriptionTiers.$inferInsert> = {},
    ): Promise<string> {
      const [tier] = await testDb
        .insert(schema.subscriptionTiers)
        .values({ name, displayName: name.toUpperCase(), ...overrides })
        .returning();
      return tier!.id;
    }

    it('creates a subscription_tiers row with the documented column shape', async () => {
      const [tier] = await testDb
        .insert(schema.subscriptionTiers)
        .values({
          name: 'free-shape',
          displayName: 'Free',
          description: 'Starter plan',
          priceCents: null,
          stripePriceIdMonthly: null,
          stripePriceIdYearly: null,
        })
        .returning();

      expect(tier).toBeDefined();
      expect(tier!.name).toBe('free-shape');
      expect(tier!.isActive).toBe(true);
      expect(tier!.sortOrder).toBe(0);
      expect(tier!.priceCents).toBeNull();
      expect(tier!.createdAt).toBeInstanceOf(Date);
    });

    it('enforces the unique tier name constraint', async () => {
      await createTier('dup-tier');

      await expect(createTier('dup-tier')).rejects.toThrow();
    });

    it('stores the user_subscriptions status + billing_interval text unions', async () => {
      const tierId = await createTier('pro-subs');
      const userId = '550e8400-e29b-41d4-a716-446655440100';

      const [sub] = await testDb
        .insert(schema.userSubscriptions)
        .values({
          userId,
          tierId,
          status: 'trial',
          billingInterval: 'monthly',
          hasTrialed: true,
        })
        .returning();

      expect(sub).toBeDefined();
      expect(sub!.status).toBe('trial');
      expect(sub!.billingInterval).toBe('monthly');
      expect(sub!.hasTrialed).toBe(true);
      // The union values are exported for the CHECK guard in prod-setup.sql.
      expect(schema.userSubscriptionStatusEnum).toContain('trial');
      expect(schema.billingIntervalEnum).toContain('yearly');
    });

    it('enforces the unique user_id constraint on user_subscriptions', async () => {
      const tierId = await createTier('uniq-user-tier');
      const userId = '550e8400-e29b-41d4-a716-446655440101';

      await testDb.insert(schema.userSubscriptions).values({ userId, tierId });

      await expect(
        testDb.insert(schema.userSubscriptions).values({ userId, tierId }),
      ).rejects.toThrow();
    });

    it('stores tier_quotas as a two-pool config with generic unit keys', async () => {
      const tierId = await createTier('quota-tier');

      const [quota] = await testDb
        .insert(schema.tierQuotas)
        .values({
          tierId,
          resourceType: 'generation',
          premiumUnitKey: 'premium-pool',
          premiumPeriodLimit: 1000,
          fallbackUnitKey: 'fallback-pool',
          fallbackPeriodLimit: 500,
        })
        .returning();

      expect(quota).toBeDefined();
      expect(quota!.premiumUnitKey).toBe('premium-pool');
      expect(quota!.fallbackUnitKey).toBe('fallback-pool');
      expect(quota!.warningThresholdPct).toBe(90);
    });

    it('cascade-deletes tier_quotas when the tier is removed', async () => {
      const tierId = await createTier('cascade-tier');
      await testDb.insert(schema.tierQuotas).values({
        tierId,
        resourceType: 'generation',
        fallbackUnitKey: 'fallback-pool',
        fallbackPeriodLimit: 100,
      });

      await testDb.delete(schema.subscriptionTiers).where(eq(schema.subscriptionTiers.id, tierId));

      const remaining = await testDb
        .select()
        .from(schema.tierQuotas)
        .where(eq(schema.tierQuotas.tierId, tierId));

      expect(remaining).toHaveLength(0);
    });

    it('tracks resource_usage units per (user, resource, period)', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440102';

      const [usage] = await testDb
        .insert(schema.resourceUsage)
        .values({
          userId,
          resourceType: 'generation',
          periodStart: '2026-06-01',
          periodEnd: '2026-06-08',
          premiumUnitsUsed: 10,
          fallbackUnitsUsed: 5,
        })
        .returning();

      expect(usage).toBeDefined();
      expect(usage!.premiumUnitsUsed).toBe(10);
      expect(usage!.fallbackUnitsUsed).toBe(5);
    });

    it('enforces the unique (user, resource, period_start) constraint on resource_usage', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440103';
      const row = {
        userId,
        resourceType: 'generation',
        periodStart: '2026-06-01',
        periodEnd: '2026-06-08',
      };

      await testDb.insert(schema.resourceUsage).values(row);

      await expect(
        testDb.insert(schema.resourceUsage).values(row),
      ).rejects.toThrow();
    });
  });
});
