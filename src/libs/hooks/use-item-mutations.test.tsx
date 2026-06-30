import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/libs/queries/keys';

// Control the wrapped action's result per test by mocking the seam module the
// hook imports from.
const createItem = vi.fn();
const deleteItem = vi.fn();

vi.mock('@/libs/actions/items', () => ({ createItem, deleteItem }));

const { useItemMutations } = await import('./use-item-mutations');

function makeWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useItemMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invalidates the items list on a successful action', async () => {
    createItem.mockResolvedValueOnce({ data: { id: '1' }, error: null });

    const client = new QueryClient();
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useItemMutations(), {
      wrapper: makeWrapper(client),
    });

    let actionResult: Awaited<ReturnType<typeof result.current.createItem>>;
    await act(async () => {
      actionResult = await result.current.createItem({ name: 'Widget' });
    });

    expect(actionResult!.error).toBeNull();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.items.all });
  });

  it('does NOT invalidate when the action returns an error', async () => {
    createItem.mockResolvedValueOnce({
      data: null,
      error: { message: 'nope', code: 'VALIDATION_ERROR' },
    });

    const client = new QueryClient();
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useItemMutations(), {
      wrapper: makeWrapper(client),
    });

    let actionResult: Awaited<ReturnType<typeof result.current.createItem>>;
    await act(async () => {
      actionResult = await result.current.createItem({ name: 'Widget' });
    });

    expect(actionResult!.error).not.toBeNull();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
