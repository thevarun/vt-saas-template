// @vitest-environment node
//
// Focused coverage for the Stripe webhook idempotency guard (event.id dedup).
// Stripe re-delivers the same event.id on a non-2xx; the dedup ledger must let
// the handler (and its non-idempotent side effects: analytics + emails) run once
// on first-seen, and short-circuit a re-delivery.
import type Stripe from 'stripe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockConstructEvent = vi.fn();

vi.mock('@/libs/stripe/client', () => ({
  getStripe: () => ({
    webhooks: { constructEvent: mockConstructEvent },
    subscriptions: { retrieve: vi.fn() },
  }),
}));

vi.mock('@/libs/Env', () => ({
  Env: { STRIPE_WEBHOOK_SECRET: 'whsec_test' },
}));

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

vi.mock('@/libs/Logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const mockTrackEventServer = vi.fn().mockResolvedValue(undefined);
vi.mock('@/libs/analytics/server', () => ({
  trackEventServer: (...a: unknown[]) => mockTrackEventServer(...a),
}));

const mockSendEnded = vi.fn();
vi.mock('@/libs/email/sendSubscriptionEmails', () => ({
  sendSubscriptionEndedEmail: (...a: unknown[]) => mockSendEnded(...a),
  sendSubscriptionStartedEmail: vi.fn(),
}));

vi.mock('@/libs/jobs/blocking', () => ({
  blockScheduledTasksForUser: vi.fn().mockResolvedValue(0),
}));

vi.mock('@/libs/subscriptions/quota', () => ({
  invalidateQuotaCache: vi.fn(),
}));

vi.mock('@/libs/supabase/admin', () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        getUserById: vi.fn().mockResolvedValue({
          data: { user: { email: 'u@example.com', user_metadata: {} } },
          error: null,
        }),
      },
    },
  }),
}));

// ── DB mock ────────────────────────────────────────────────────────────────
// recordWebhookEvent: insert(...).values(...).onConflictDoNothing(...).returning()
// releaseWebhookEvent: delete(...).where(...)
// handleSubscriptionDeleted: several select(...).from(...).where(...).limit(1)
//   + update(...).set(...).where(...)
const insertReturning = vi.fn();
const mockDelete = vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }));

// Sequential select results queue for the handler's reads.
let selectResults: unknown[][] = [];
let selectIdx = 0;
function nextSelect(): Promise<unknown[]> {
  const r = selectResults[selectIdx] ?? [];
  selectIdx++;
  return Promise.resolve(r);
}
const selectChain = {
  select: vi.fn(() => selectChain),
  from: vi.fn(() => selectChain),
  where: vi.fn(() => selectChain),
  limit: vi.fn(() => nextSelect()),
};
const updateChain = {
  set: vi.fn(() => updateChain),
  where: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/libs/DB', () => ({
  db: {
    insert: () => ({
      values: () => ({
        onConflictDoNothing: () => ({ returning: () => insertReturning() }),
      }),
    }),
    delete: () => mockDelete(),
    select: () => selectChain,
    // invalidateAllQuotaCaches iterates distinct resource types; return none.
    selectDistinct: () => ({ from: vi.fn().mockResolvedValue([]) }),
    update: () => updateChain,
  },
}));

const { POST } = await import('./route');

function makeRequest(): Request {
  return new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 'sig' },
    body: 'rawbody',
  });
}

function deletedEvent(): Stripe.Event {
  return {
    id: 'evt_dup_1',
    type: 'customer.subscription.deleted',
    data: { object: { id: 'sub_123' } },
  } as unknown as Stripe.Event;
}

describe('POST /api/stripe/webhook — idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore default behaviour (clearAllMocks wipes implementations).
    selectChain.select.mockReturnValue(selectChain);
    selectChain.from.mockReturnValue(selectChain);
    selectChain.where.mockReturnValue(selectChain);
    selectChain.limit.mockImplementation(() => nextSelect());
    updateChain.set.mockReturnValue(updateChain);
    updateChain.where.mockResolvedValue(undefined);
    mockDelete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    selectIdx = 0;
    // Handler reads for customer.subscription.deleted:
    //   1. user_subscriptions row → { userId, tierId }
    //   2. free tier lookup → { id }
    //   3. getTierName → { displayName }
    selectResults = [
      [{ userId: 'user-1', tierId: 'tier-pro' }],
      [{ id: 'tier-free' }],
      [{ displayName: 'Pro', name: 'pro' }],
    ];
    mockConstructEvent.mockReturnValue(deletedEvent());
  });

  it('first delivery: records event, runs handler, fires side effects', async () => {
    insertReturning.mockResolvedValueOnce([{ eventId: 'evt_dup_1' }]); // first-seen

    const res = await POST(makeRequest() as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ received: true });
    // Side effects fired exactly once.
    expect(mockSendEnded).toHaveBeenCalledTimes(1);
    expect(mockTrackEventServer).toHaveBeenCalledWith(
      'subscription_cancelled',
      expect.anything(),
      'user-1',
    );
  });

  it('re-delivery of the same event.id: short-circuits, no side effects', async () => {
    insertReturning.mockResolvedValueOnce([]); // conflict → already processed

    const res = await POST(makeRequest() as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ received: true, duplicate: true });
    // Handler never ran → no emails, no analytics, no DB update.
    expect(mockSendEnded).not.toHaveBeenCalled();
    expect(mockTrackEventServer).not.toHaveBeenCalled();
    expect(updateChain.set).not.toHaveBeenCalled();
  });

  it('handler error after claim: releases the event id so Stripe can retry', async () => {
    insertReturning.mockResolvedValueOnce([{ eventId: 'evt_dup_1' }]); // first-seen
    // Force the handler to throw: no matching subscription row AND make the email
    // path explode is hard; instead drive a thrown error from the update step.
    updateChain.where.mockRejectedValueOnce(new Error('db down'));

    const res = await POST(makeRequest() as never);

    expect(res.status).toBe(500);
    // The claim was released so the retry isn't treated as a duplicate.
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });
});

function invoicePaidEvent(id: string): Stripe.Event {
  return {
    id,
    type: 'invoice.paid',
    data: {
      object: {
        parent: { subscription_details: { subscription: 'sub_777' } },
      },
    },
  } as unknown as Stripe.Event;
}

describe('POST /api/stripe/webhook — order-independent trial→active conversion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectChain.select.mockReturnValue(selectChain);
    selectChain.from.mockReturnValue(selectChain);
    selectChain.where.mockReturnValue(selectChain);
    selectChain.limit.mockImplementation(() => nextSelect());
    updateChain.set.mockReturnValue(updateChain);
    updateChain.where.mockResolvedValue(undefined);
    mockDelete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    selectIdx = 0;
    insertReturning.mockResolvedValue([{ eventId: 'evt_x' }]); // always first-seen
  });

  it('invoice.paid arriving FIRST on a trial sub resets anchor + fires trial_upgrade once', async () => {
    // Reads: 1. sub row (status=trial) ; 2. getTierName
    selectResults = [
      [{ userId: 'user-9', currentStatus: 'trial', billingInterval: 'monthly', tierId: 'tier-pro' }],
      [{ displayName: 'Pro', name: 'pro' }],
    ];
    mockConstructEvent.mockReturnValue(invoicePaidEvent('evt_inv_1'));

    const res = await POST(makeRequest() as never);

    expect(res.status).toBe(200);
    // Anchor reset is in the update set.
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active', currentPeriodAnchorAt: expect.any(Date) }),
    );
    // Conversion fired exactly once with trial_upgrade source.
    expect(mockTrackEventServer).toHaveBeenCalledWith(
      'subscription_converted',
      expect.objectContaining({ conversion_source: 'trial_upgrade', billing_interval: 'monthly', tier_name: 'Pro' }),
      'user-9',
    );
  });

  it('invoice.paid on an already-active sub does NOT reset anchor or re-fire conversion', async () => {
    // The later event (status already active): no anchor reset, no conversion.
    selectResults = [
      [{ userId: 'user-9', currentStatus: 'active', billingInterval: 'monthly', tierId: 'tier-pro' }],
    ];
    mockConstructEvent.mockReturnValue(invoicePaidEvent('evt_inv_2'));

    const res = await POST(makeRequest() as never);

    expect(res.status).toBe(200);
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active' }),
    );

    // No anchor reset on the active-path update.
    const setArg = (updateChain.set.mock.calls as unknown[][])[0]?.[0] as Record<string, unknown>;

    expect(setArg).not.toHaveProperty('currentPeriodAnchorAt');
    expect(mockTrackEventServer).not.toHaveBeenCalled();
  });
});
