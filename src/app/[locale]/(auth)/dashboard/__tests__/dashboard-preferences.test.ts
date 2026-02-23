import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/libs/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({}),
}));

vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('en'),
}));

vi.mock('@/libs/Logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('@/components/auth/AccessDeniedToast', () => ({
  AccessDeniedToast: () => null,
}));

vi.mock('@/components/auth/VerificationToast', () => ({
  VerificationToast: () => null,
}));

vi.mock('@/components/dashboard/WelcomeDashboard', () => ({
  WelcomeDashboard: ({ userName }: { userName: string }) => `Welcome ${userName}`,
}));

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    Suspense: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock DB with onConflictDoNothing chain
const mockOnConflictDoNothing = vi.fn().mockResolvedValue(undefined);
const mockValues = vi.fn().mockReturnValue({ onConflictDoNothing: mockOnConflictDoNothing });
const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

vi.mock('@/libs/DB', () => ({
  db: {
    insert: (...args: unknown[]) => mockInsert(...args),
  },
}));

const { createClient } = await import('@/libs/supabase/server');

function mockAuth(user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null = { id: 'user-1', email: 'test@test.com' }) {
  vi.mocked(createClient).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
  } as any);
}

describe('Dashboard page - preferences auto-creation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnConflictDoNothing.mockResolvedValue(undefined);
  });

  it('uses idempotent upsert with onConflictDoNothing', async () => {
    mockAuth({ id: 'user-1', email: 'test@test.com' });

    const DashboardPage = (await import('../page')).default;
    await DashboardPage();

    // Verify: single insert with onConflictDoNothing (no select-then-insert)
    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalled();
    expect(mockOnConflictDoNothing).toHaveBeenCalled();
  });

  it('does not throw even if preferences already exist (conflict is silently ignored)', async () => {
    mockAuth({ id: 'user-1', email: 'test@test.com' });

    // onConflictDoNothing resolves successfully even on conflict
    mockOnConflictDoNothing.mockResolvedValue(undefined);

    const DashboardPage = (await import('../page')).default;

    await expect(DashboardPage()).resolves.not.toThrow();
  });

  it('does not insert preferences when user is not authenticated', async () => {
    mockAuth(null);

    const DashboardPage = (await import('../page')).default;
    await DashboardPage();

    expect(mockInsert).not.toHaveBeenCalled();
  });
});
