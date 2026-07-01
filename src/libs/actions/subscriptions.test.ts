// @vitest-environment node
import { cookies } from 'next/headers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { logAdminAction } from '@/libs/audit/logAdminAction';
import { isAdmin } from '@/libs/auth/isAdmin';
import { db } from '@/libs/DB';
import { sendPromotionGrantedEmail } from '@/libs/email/sendSubscriptionEmails';
import { invalidateAllQuotaCaches } from '@/libs/subscriptions/quota-cache';
import { createAdminClient } from '@/libs/supabase/admin';
import { createClient } from '@/libs/supabase/server';

import {
  assignTier,
  getActiveTiers,
  getUserSubscriptionDetail,
} from './subscriptions';

// Schema modules read DB_SCHEMA at import time; this worktree has no .env.local,
// so set it before any import that pulls in the schema.
vi.hoisted(() => {
  process.env.DB_SCHEMA ??= 'vt_saas';
  process.env.NEXT_PUBLIC_DB_SCHEMA ??= 'vt_saas';
});

// --- Mocks ---

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/libs/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/libs/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/libs/DB', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  },
}));

vi.mock('@/libs/Logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/libs/audit/logAdminAction', () => ({
  logAdminAction: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@/libs/subscriptions/quota-cache', () => ({
  invalidateAllQuotaCaches: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/libs/email/sendSubscriptionEmails', () => ({
  sendPromotionGrantedEmail: vi.fn(),
}));

vi.mock('@/libs/auth/isAdmin', () => ({
  isAdmin: vi.fn(() => true),
}));

// --- Helpers ---

const mockCookieStore = {} as Awaited<ReturnType<typeof cookies>>;
const adminUser = {
  id: 'admin-1',
  email: 'admin@test.com',
  app_metadata: {},
  user_metadata: {},
};

function mockAuth(user: unknown = adminUser, error: unknown = null) {
  (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
    mockCookieStore,
  );
  (createClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error }),
    },
  });
}

// db.select() returns a chainable builder; each queued result feeds the next
// `.select()` call in FIFO order. The builder is thenable so awaiting it (with
// or without .limit/.where/.orderBy) resolves to the queued rows.
function queueSelects(...results: unknown[][]) {
  const queue = [...results];
  (db.select as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
    const rows = queue.shift() ?? [];
    const builder: Record<string, unknown> = {};
    for (const m of ['from', 'innerJoin', 'where', 'orderBy', 'limit']) {
      builder[m] = vi.fn(() => builder);
    }
    builder.then = (resolve: (v: unknown[]) => unknown) => resolve(rows);
    return builder;
  });
}

function mockUpdate() {
  (db.update as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })),
  });
}

const TIER_FREE = '11111111-1111-4111-8111-111111111111';
const TIER_PRO = '22222222-2222-4222-8222-222222222222';
const TIER_PROMO = '33333333-3333-4333-8333-333333333333';
const TARGET_USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function validAssignInput(overrides: Record<string, unknown> = {}) {
  return {
    userId: TARGET_USER,
    tierId: TIER_PROMO,
    status: 'active',
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    ...overrides,
  };
}

function mockAdminGetUser(email: string | null) {
  (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    auth: {
      admin: {
        getUserById: vi.fn().mockResolvedValue({
          data: { user: email ? { email, user_metadata: {} } : null },
        }),
      },
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  (isAdmin as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
  mockUpdate();
});

describe('admin gating', () => {
  it('rejects unauthenticated callers with AUTH_REQUIRED', async () => {
    mockAuth(null);
    const res = await getActiveTiers();

    expect(res.data).toBeNull();
    expect(res.error?.code).toBe('AUTH_REQUIRED');
  });

  it('rejects non-admins with FORBIDDEN', async () => {
    mockAuth();
    (isAdmin as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
    const res = await assignTier(validAssignInput());

    expect(res.data).toBeNull();
    expect(res.error?.code).toBe('FORBIDDEN');
  });
});

describe('getUserSubscriptionDetail', () => {
  it('returns the bare subscription summary', async () => {
    mockAuth();
    const started = new Date('2026-01-01T00:00:00.000Z');
    queueSelects([
      {
        id: 'sub-1',
        tierId: TIER_FREE,
        tierName: 'free',
        displayName: 'Free',
        status: 'active',
        trialExpiresAt: null,
        expiresAt: null,
        startedAt: started,
      },
    ]);

    const res = await getUserSubscriptionDetail(TARGET_USER);

    expect(res.error).toBeNull();
    expect(res.data).toEqual({
      id: 'sub-1',
      tierId: TIER_FREE,
      tierName: 'free',
      displayName: 'Free',
      status: 'active',
      trialExpiresAt: null,
      expiresAt: null,
      startedAt: started,
    });
  });

  it('returns NOT_FOUND when the user has no subscription row', async () => {
    mockAuth();
    queueSelects([]);
    const res = await getUserSubscriptionDetail(TARGET_USER);

    expect(res.data).toBeNull();
    expect(res.error?.code).toBe('NOT_FOUND');
  });
});

describe('assignTier — eligibility guard', () => {
  it('blocks demoting an active paid user onto a promotion (CONFLICT)', async () => {
    mockAuth();
    queueSelects(
      // old subscription: active pro
      [
        {
          tierId: TIER_PRO,
          tierName: 'pro',
          status: 'active',
          trialExpiresAt: null,
        },
      ],
      // new tier lookup: promotion
      [{ name: 'promotion' }],
    );

    const res = await assignTier(validAssignInput());

    expect(res.data).toBeNull();
    expect(res.error?.code).toBe('CONFLICT');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('allows granting a promotion to a free user', async () => {
    mockAuth();
    mockAdminGetUser('user@test.com');
    queueSelects(
      [
        {
          tierId: TIER_FREE,
          tierName: 'free',
          status: 'active',
          trialExpiresAt: null,
        },
      ],
      [{ name: 'promotion' }],
    );

    const res = await assignTier(validAssignInput());

    expect(res.error).toBeNull();
    expect(res.data).toEqual({ userId: TARGET_USER });
    expect(db.update).toHaveBeenCalled();
    expect(invalidateAllQuotaCaches).toHaveBeenCalledWith(TARGET_USER);
  });
});

describe('assignTier — promotion expiry guard', () => {
  it('rejects an active promotion grant with no expiry (VALIDATION_ERROR)', async () => {
    mockAuth();
    mockAdminGetUser('user@test.com');
    queueSelects(
      [
        {
          tierId: TIER_FREE,
          tierName: 'free',
          status: 'active',
          trialExpiresAt: null,
        },
      ],
      [{ name: 'promotion' }],
    );

    const res = await assignTier(validAssignInput({ expiresAt: null }));

    expect(res.error?.code).toBe('VALIDATION_ERROR');
    expect(res.data).toBeNull();
    expect(db.update).not.toHaveBeenCalled();
  });
});

describe('assignTier — promotion email (fresh grant only)', () => {
  it('sends the promotion email on a fresh active promo grant', async () => {
    mockAuth();
    mockAdminGetUser('user@test.com');
    queueSelects(
      [
        {
          tierId: TIER_FREE,
          tierName: 'free',
          status: 'active',
          trialExpiresAt: null,
        },
      ],
      [{ name: 'promotion' }],
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    await assignTier(validAssignInput({ expiresAt }));

    expect(sendPromotionGrantedEmail).toHaveBeenCalledTimes(1);
    expect(sendPromotionGrantedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@test.com',
        tierName: 'promotion',
      }),
    );
  });

  it('does NOT resend when the user is already on promotion', async () => {
    mockAuth();
    mockAdminGetUser('user@test.com');
    queueSelects(
      // already on promotion
      [
        {
          tierId: TIER_PROMO,
          tierName: 'promotion',
          status: 'active',
          trialExpiresAt: null,
        },
      ],
      [{ name: 'promotion' }],
    );

    await assignTier(validAssignInput());

    expect(sendPromotionGrantedEmail).not.toHaveBeenCalled();
  });

  it('does NOT send for a non-promotion grant', async () => {
    mockAuth();
    queueSelects(
      [
        {
          tierId: TIER_FREE,
          tierName: 'free',
          status: 'active',
          trialExpiresAt: null,
        },
      ],
      [{ name: 'pro' }],
    );

    await assignTier(validAssignInput({ tierId: TIER_PRO, expiresAt: null }));

    expect(sendPromotionGrantedEmail).not.toHaveBeenCalled();
  });
});

describe('assignTier — audit log', () => {
  it('writes an assign_tier audit entry with before/after metadata', async () => {
    mockAuth();
    mockAdminGetUser('user@test.com');
    queueSelects(
      [
        {
          tierId: TIER_FREE,
          tierName: 'free',
          status: 'active',
          trialExpiresAt: null,
        },
      ],
      [{ name: 'promotion' }],
    );

    await assignTier(validAssignInput({ reason: 'beta tester' }));

    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: 'admin-1',
        action: 'assign_tier',
        targetType: 'user',
        targetId: TARGET_USER,
        metadata: expect.objectContaining({
          reason: 'beta tester',
          before: expect.objectContaining({ tierName: 'free' }),
          after: expect.objectContaining({
            tierName: 'promotion',
            status: 'active',
          }),
        }),
      }),
    );
  });
});
