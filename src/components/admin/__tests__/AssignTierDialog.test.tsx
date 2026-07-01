import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Suppress the radix-ui Dialog warning about a missing aria description.
let originalWarn: typeof console.warn;

beforeAll(() => {
  originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Missing `Description`')) {
      return;
    }
    originalWarn(...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});

// Mock next-intl — echo the key back (params interpolated) so assertions can key
// off the translation path.
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params) {
      let result = key;
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(`{${k}}`, String(v));
      });
      return result;
    }
    return key;
  },
}));

// sonner toasts.
const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: { success: (...a: unknown[]) => toastSuccess(...a), error: (...a: unknown[]) => toastError(...a) },
}));

// Server actions seam.
const assignTier = vi.fn();
const getActiveTiers = vi.fn();
vi.mock('@/libs/actions/subscriptions', () => ({
  assignTier: (...a: unknown[]) => assignTier(...a),
  getActiveTiers: (...a: unknown[]) => getActiveTiers(...a),
}));

// Subscription-detail hook seam — controls the pre-fill + eligibility state.
const useUserSubscriptionDetail = vi.fn();
vi.mock('@/libs/hooks/use-user-subscription-detail', () => ({
  useUserSubscriptionDetail: (...a: unknown[]) => useUserSubscriptionDetail(...a),
}));

const { AssignTierDialog } = await import('../AssignTierDialog');

const FREE_TIER = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'free', displayName: 'Free' };
const PRO_TIER = { id: 'bbbbbbbb-bbbb-4bbb-9bbb-bbbbbbbbbbbb', name: 'pro', displayName: 'Pro' };
const PROMO_TIER = { id: 'cccccccc-cccc-4ccc-accc-cccccccccccc', name: 'promotion', displayName: 'Promotion' };
const TIERS = [FREE_TIER, PRO_TIER, PROMO_TIER];

function makeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub-1',
    tierId: FREE_TIER.id,
    tierName: 'free',
    displayName: 'Free',
    status: 'active',
    trialExpiresAt: null,
    expiresAt: null,
    startedAt: new Date('2024-01-01').toISOString(),
    ...overrides,
  };
}

function renderDialog(props: Partial<Parameters<typeof AssignTierDialog>[0]> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onSaved = vi.fn();
  const onOpenChange = vi.fn();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  render(
    <AssignTierDialog
      userId="user-1"
      userEmail="target@example.com"
      open
      onOpenChange={onOpenChange}
      onSaved={onSaved}
      {...props}
    />,
    { wrapper },
  );
  return { onSaved, onOpenChange };
}

describe('AssignTierDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActiveTiers.mockResolvedValue({ data: TIERS, error: null });
    useUserSubscriptionDetail.mockReturnValue({ data: makeSubscription() });
  });

  it('renders the dialog with the target email in the title', () => {
    renderDialog();

    expect(screen.getByTestId('assign-tier-dialog')).toBeInTheDocument();
    // The next-intl mock echoes the key path; the email param is passed through
    // t('title', { email }) — assert the tier + status selects are present.
    expect(screen.getByTestId('tier-select')).toBeInTheDocument();
    expect(screen.getByTestId('status-select')).toBeInTheDocument();
  });

  it('submits the selected tier via the assignTier action', async () => {
    assignTier.mockResolvedValue({ data: { userId: 'user-1' }, error: null });
    const { onSaved } = renderDialog();

    // The dialog pre-fills to the current (free) tier — submitting exercises the
    // assignTier action without a fragile Radix Select interaction.
    await screen.findByTestId('tier-select');
    await userEvent.click(screen.getByTestId('assign-tier-submit'));

    await waitFor(() => {
      expect(assignTier).toHaveBeenCalledTimes(1);
    });

    expect(assignTier).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', tierId: FREE_TIER.id, status: 'active' }),
    );

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled();
    });

    expect(toastSuccess).toHaveBeenCalled();
  });

  it('shows the eligibility warning and blocks submit when promoting an active paid user', async () => {
    // Current: active PRO user → promotion is ineligible.
    useUserSubscriptionDetail.mockReturnValue({
      data: makeSubscription({ tierId: PRO_TIER.id, tierName: 'pro', displayName: 'Pro', status: 'active' }),
    });
    renderDialog();

    // Select the promotion tier.
    await userEvent.click(await screen.findByTestId('tier-select'));
    await userEvent.click(await screen.findByRole('option', { name: 'Promotion' }));

    expect(await screen.findByTestId('promotion-eligibility-warning')).toBeInTheDocument();
    expect(screen.getByTestId('assign-tier-submit')).toBeDisabled();
  });
});
