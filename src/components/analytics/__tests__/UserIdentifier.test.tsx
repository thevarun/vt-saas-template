import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as analytics from '@/libs/analytics';
import * as supabaseClient from '@/libs/supabase/client';

import { UserIdentifier } from '../UserIdentifier';

vi.mock('@/libs/analytics');
vi.mock('@/libs/supabase/client');

describe('UserIdentifier', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(supabaseClient, 'createClient').mockReturnValue(mockSupabase as any);
  });

  it('identifies user when user exists on mount', async () => {
    const identifySpy = vi.spyOn(analytics, 'identifyUser');

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    render(<UserIdentifier />);

    await waitFor(() => {
      expect(identifySpy).toHaveBeenCalledWith(mockUser.id, {
        email: mockUser.email,
        createdAt: new Date(mockUser.created_at),
      });
    });
  });

  it('does not identify when no user exists', async () => {
    const identifySpy = vi.spyOn(analytics, 'identifyUser');

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    render(<UserIdentifier />);

    await waitFor(() => {
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
    });

    expect(identifySpy).not.toHaveBeenCalled();
  });

  it('identifies user on SIGNED_IN event', async () => {
    const identifySpy = vi.spyOn(analytics, 'identifyUser');

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    let authCallback: any;
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authCallback = callback;
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      };
    });

    render(<UserIdentifier />);

    // Trigger SIGNED_IN event
    authCallback('SIGNED_IN', { user: mockUser });

    await waitFor(() => {
      expect(identifySpy).toHaveBeenCalledWith(mockUser.id, {
        email: mockUser.email,
        createdAt: new Date(mockUser.created_at),
      });
    });
  });

  it('resets user on SIGNED_OUT event', async () => {
    const resetSpy = vi.spyOn(analytics, 'resetUser');

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    let authCallback: any;
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authCallback = callback;
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      };
    });

    render(<UserIdentifier />);

    // Trigger SIGNED_OUT event
    authCallback('SIGNED_OUT', null);

    await waitFor(() => {
      expect(resetSpy).toHaveBeenCalled();
    });
  });

  it('unsubscribes from auth changes on unmount', () => {
    const unsubscribeSpy = vi.fn();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: unsubscribeSpy } },
    });

    const { unmount } = render(<UserIdentifier />);

    unmount();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  it('renders nothing (null)', () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    const { container } = render(<UserIdentifier />);

    expect(container).toBeEmptyDOMElement();
  });
});
