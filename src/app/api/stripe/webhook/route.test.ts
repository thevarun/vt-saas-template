// @vitest-environment node
//
// Focused coverage for the Stripe webhook idempotency ledger (event.id dedup).
// Stripe re-delivers the same event.id on a non-2xx; the ledger uses a two-phase
// claim/complete: claim the row before dispatch, set processed_at only after the
// handler succeeds. Dedupe is keyed on COMPLETION — a row with processed_at NULL
// is a prior attempt that threw and MUST be reprocessed (we never delete on
// failure, so a failing delete can't orphan a claim → paid-but-not-provisioned).
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
// claim:           insert(...).values(...).onConflictDoNothing(...).returning()
// processed re-check (only when claim conflicts): select(...).from(...).where(...).limit(1)
// mark processed (after handler ok):              update(...).set(...).where(...)
// handler reads (e.g. handleSubscriptionDeleted): select(...).from(...).where(...).limit(1)
//   + update(...).set(...).where(...)
// The re-check shares the sequential select queue, so prepend its row to
// selectResults when exercising the conflict path.
const insertReturning = vi.fn();

// Sequential select results queue for the re-check + handler reads.
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

  it('first delivery: claims event, runs handler, fires side effects, marks processed', async () => {
    insertReturning.mockResolvedValueOnce([{ eventId: 'evt_dup_1' }]); // first-seen claim

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
    // After the handler succeeds, processed_at is set so redeliveries skip.
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ processedAt: expect.any(Date) }),
    );
  });

  it('re-delivery with processed_at SET: short-circuits as duplicate, no side effects', async () => {
    insertReturning.mockResolvedValueOnce([]); // conflict → row already exists
    // Re-check reads the existing row; processed_at set ⇒ true duplicate.
    selectResults = [[{ processedAt: new Date() }]];

    const res = await POST(makeRequest() as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ received: true, duplicate: true });
    // Handler never ran → no emails, no analytics, no DB write.
    expect(mockSendEnded).not.toHaveBeenCalled();
    expect(mockTrackEventServer).not.toHaveBeenCalled();
    expect(updateChain.set).not.toHaveBeenCalled();
  });

  it('re-delivery with a STALE NULL claim: reprocesses (prior attempt died, not a dup)', async () => {
    insertReturning.mockResolvedValueOnce([]); // conflict → row already exists
    // Re-check: processed_at NULL and received_at older than STALE_CLAIM_MS ⇒ the
    // prior attempt died before completing, so it is safe to reprocess. Then the
    // handler's own reads follow (deleted-event reads).
    const staleReceivedAt = new Date(Date.now() - 16 * 60 * 1000); // 16 min ago
    selectResults = [
      [{ processedAt: null, receivedAt: staleReceivedAt }],
      [{ userId: 'user-1', tierId: 'tier-pro' }],
      [{ id: 'tier-free' }],
      [{ displayName: 'Pro', name: 'pro' }],
    ];

    const res = await POST(makeRequest() as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ received: true });
    // Handler re-ran → side effects fire (this is the paid-but-not-provisioned fix).
    expect(mockSendEnded).toHaveBeenCalledTimes(1);
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ processedAt: expect.any(Date) }),
    );
  });

  it('re-delivery with a FRESH NULL claim: treated as in-flight, does NOT reprocess', async () => {
    insertReturning.mockResolvedValueOnce([]); // conflict → row already exists
    // Re-check: processed_at NULL but received_at is recent ⇒ another delivery is
    // mid-flight. We must skip to avoid double-running non-idempotent side effects.
    selectResults = [[{ processedAt: null, receivedAt: new Date() }]];

    const res = await POST(makeRequest() as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ received: true, duplicate: true });
    // Handler never ran → no emails, no analytics, no mark-processed write.
    expect(mockSendEnded).not.toHaveBeenCalled();
    expect(mockTrackEventServer).not.toHaveBeenCalled();
    expect(updateChain.set).not.toHaveBeenCalled();
  });

  it('handler error after claim: does NOT delete the claim (leaves row reprocessable)', async () => {
    insertReturning.mockResolvedValueOnce([{ eventId: 'evt_dup_1' }]); // first-seen claim
    // Make a handler DB write throw. The mark-processed update must NOT run, and
    // the claim row must be left in place (processed_at NULL) for Stripe's retry.
    updateChain.where.mockRejectedValueOnce(new Error('db down'));

    const res = await POST(makeRequest() as never);

    expect(res.status).toBe(500);
    // No "release"/delete on failure — the only update attempted was the handler's
    // (which threw); mark-processed must not have run.
    expect(updateChain.set).not.toHaveBeenCalledWith(
      expect.objectContaining({ processedAt: expect.any(Date) }),
    );
  });

  it('ledger claim error: fails closed with 500 (no dispatch)', async () => {
    insertReturning.mockRejectedValueOnce(new Error('ledger down'));

    const res = await POST(makeRequest() as never);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Webhook ledger error' });
    // Never dispatched the handler → no side effects.
    expect(mockSendEnded).not.toHaveBeenCalled();
    expect(mockTrackEventServer).not.toHaveBeenCalled();
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
    selectIdx = 0;
    insertReturning.mockResolvedValue([{ eventId: 'evt_x' }]); // always first-seen
  });

  it('invoice.paid arriving FIRST on a trial sub resets anchor + fires trial_upgrade once', async () => {
    // Reads: 1. sub row (status=trial) ; 2. getTierName
    selectResults = [
      [
        {
          userId: 'user-9',
          currentStatus: 'trial',
          billingInterval: 'monthly',
          tierId: 'tier-pro',
        },
      ],
      [{ displayName: 'Pro', name: 'pro' }],
    ];
    mockConstructEvent.mockReturnValue(invoicePaidEvent('evt_inv_1'));

    const res = await POST(makeRequest() as never);

    expect(res.status).toBe(200);
    // Anchor reset is in the update set.
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
        currentPeriodAnchorAt: expect.any(Date),
      }),
    );
    // Conversion fired exactly once with trial_upgrade source.
    expect(mockTrackEventServer).toHaveBeenCalledWith(
      'subscription_converted',
      expect.objectContaining({
        conversion_source: 'trial_upgrade',
        billing_interval: 'monthly',
        tier_name: 'Pro',
      }),
      'user-9',
    );
  });

  it('invoice.paid on an already-active sub does NOT reset anchor or re-fire conversion', async () => {
    // The later event (status already active): no anchor reset, no conversion.
    selectResults = [
      [
        {
          userId: 'user-9',
          currentStatus: 'active',
          billingInterval: 'monthly',
          tierId: 'tier-pro',
        },
      ],
    ];
    mockConstructEvent.mockReturnValue(invoicePaidEvent('evt_inv_2'));

    const res = await POST(makeRequest() as never);

    expect(res.status).toBe(200);
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active' }),
    );

    // No anchor reset on the active-path update.
    const setArg = (
      updateChain.set.mock.calls as unknown[][]
    )[0]?.[0] as Record<string, unknown>;

    expect(setArg).not.toHaveProperty('currentPeriodAnchorAt');
    expect(mockTrackEventServer).not.toHaveBeenCalled();
  });
});
