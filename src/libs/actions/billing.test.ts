import { cookies } from 'next/headers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/libs/DB';
import { getStripe } from '@/libs/stripe/client';
import { createClient } from '@/libs/supabase/server';

// --- Mocks ---

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/libs/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/libs/DB', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  },
}));

vi.mock('@/libs/Logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const mockStripe = {
  checkout: {
    sessions: {
      create: vi.fn(),
    },
  },
  billingPortal: {
    sessions: {
      create: vi.fn(),
    },
  },
};

vi.mock('@/libs/stripe/client', () => ({
  getStripe: () => mockStripe,
}));

// Suppress unused import warnings
void cookies;
void createClient;
void db;
void getStripe;

// --- Helpers ---

const mockCookieStore = {} as Awaited<ReturnType<typeof cookies>>;
const mockUser = {
  id: 'user-123',
  email: 'user@test.com',
};

function mockAuth(user: unknown = mockUser, error: unknown = null) {
  (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockCookieStore);
  (createClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error }),
    },
  });
}

function mockDbChain(result: unknown[] = []) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  };
  (db.select as unknown as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  return chain;
}

// --- Tests ---

describe('createCheckoutSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns UNAUTHORIZED when user is not authenticated', async () => {
    mockAuth(null, { message: 'Not logged in' });

    const { createCheckoutSession } = await import('./billing');
    const result = await createCheckoutSession('pro');

    expect(result.error?.code).toBe('UNAUTHORIZED');
  });

  it('returns FORBIDDEN when tier has no stripe price id', async () => {
    mockAuth();
    mockDbChain([{ id: 'tier-1', name: 'free', stripePriceIdMonthly: null, stripePriceIdYearly: null }]);

    const { createCheckoutSession } = await import('./billing');
    const result = await createCheckoutSession('free');

    expect(result.error?.code).toBe('FORBIDDEN');
    expect(result.error?.message).toBe('This tier is not available for purchase');
  });

  it('returns FORBIDDEN when tier is not found', async () => {
    mockAuth();
    mockDbChain([]);

    const { createCheckoutSession } = await import('./billing');
    const result = await createCheckoutSession('nonexistent');

    expect(result.error?.code).toBe('FORBIDDEN');
  });

  it('creates checkout session with existing stripe customer', async () => {
    mockAuth();

    // First select (tier lookup) -> tier with price ID
    // Second select (user subscription lookup) -> has stripe customer
    const selectCallCount = { count: 0 };
    const chain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() => {
        selectCallCount.count++;
        if (selectCallCount.count === 1) {
          return [{ id: 'tier-pro', name: 'pro', stripePriceIdMonthly: 'price_test_pro', stripePriceIdYearly: null }];
        }
        return [{ stripeCustomerId: 'cus_existing_123' }];
      }),
    };
    (db.select as unknown as ReturnType<typeof vi.fn>).mockReturnValue(chain);

    (mockStripe.checkout.sessions.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      url: 'https://checkout.stripe.com/test',
    });

    const { createCheckoutSession } = await import('./billing');
    const result = await createCheckoutSession('pro');

    expect(result.data?.checkoutUrl).toBe('https://checkout.stripe.com/test');
    expect(result.error).toBeNull();

    // Verify Stripe was called with customer (not customer_email).
    const createCall = (mockStripe.checkout.sessions.create as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];

    expect(createCall).toBeDefined();
    expect(createCall.customer).toBe('cus_existing_123');
    expect(createCall.customer_email).toBeUndefined();
    expect(createCall.metadata.user_id).toBe('user-123');
  });

  it('creates checkout session with customer_email when no existing customer', async () => {
    mockAuth();

    const selectCallCount = { count: 0 };
    const chain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() => {
        selectCallCount.count++;
        if (selectCallCount.count === 1) {
          return [{ id: 'tier-pro', name: 'pro', stripePriceIdMonthly: 'price_test_pro', stripePriceIdYearly: null }];
        }
        return [{ stripeCustomerId: null }];
      }),
    };
    (db.select as unknown as ReturnType<typeof vi.fn>).mockReturnValue(chain);

    (mockStripe.checkout.sessions.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      url: 'https://checkout.stripe.com/test2',
    });

    const { createCheckoutSession } = await import('./billing');
    const result = await createCheckoutSession('pro');

    expect(result.data?.checkoutUrl).toBe('https://checkout.stripe.com/test2');

    const createCall = (mockStripe.checkout.sessions.create as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];

    expect(createCall.customer_email).toBe('user@test.com');
    expect(createCall.customer).toBeUndefined();
  });

  it('returns SERVICE_UNAVAILABLE when checkout session has no URL', async () => {
    mockAuth();

    const selectCallCount = { count: 0 };
    const chain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() => {
        selectCallCount.count++;
        if (selectCallCount.count === 1) {
          return [{ id: 'tier-pro', name: 'pro', stripePriceIdMonthly: 'price_test_pro', stripePriceIdYearly: null }];
        }
        return [{ stripeCustomerId: null }];
      }),
    };
    (db.select as unknown as ReturnType<typeof vi.fn>).mockReturnValue(chain);

    (mockStripe.checkout.sessions.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      url: null,
    });

    const { createCheckoutSession } = await import('./billing');
    const result = await createCheckoutSession('pro');

    expect(result.error?.code).toBe('SERVICE_UNAVAILABLE');
  });
});

describe('createPortalSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns UNAUTHORIZED when user is not authenticated', async () => {
    mockAuth(null, { message: 'Not logged in' });

    const { createPortalSession } = await import('./billing');
    const result = await createPortalSession();

    expect(result.error?.code).toBe('UNAUTHORIZED');
  });

  it('returns NOT_FOUND when user has no stripe customer', async () => {
    mockAuth();
    mockDbChain([{ stripeCustomerId: null }]);

    const { createPortalSession } = await import('./billing');
    const result = await createPortalSession();

    expect(result.error?.code).toBe('NOT_FOUND');
    expect(result.error?.message).toBe('No billing account found. Please subscribe first.');
  });

  it('returns NOT_FOUND when no subscription row exists', async () => {
    mockAuth();
    mockDbChain([]);

    const { createPortalSession } = await import('./billing');
    const result = await createPortalSession();

    expect(result.error?.code).toBe('NOT_FOUND');
  });

  it('creates portal session successfully', async () => {
    mockAuth();
    mockDbChain([{ stripeCustomerId: 'cus_test_123' }]);

    (mockStripe.billingPortal.sessions.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      url: 'https://billing.stripe.com/portal/test',
    });

    const { createPortalSession } = await import('./billing');
    const result = await createPortalSession();

    expect(result.data?.portalUrl).toBe('https://billing.stripe.com/portal/test');
    expect(result.error).toBeNull();

    const createCall = (mockStripe.billingPortal.sessions.create as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];

    expect(createCall.customer).toBe('cus_test_123');
  });
});
