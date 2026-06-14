'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { CreateItemInput } from '@/libs/actions/items';
import { createItem as createItemAction, deleteItem as deleteItemAction } from '@/libs/actions/items';
import { queryKeys } from '@/libs/queries/keys';

/**
 * Wrapper-hook pattern: wrap a server action and own cache invalidation so
 * call-sites can't forget to refresh.
 *
 * The wrapper returns the raw `ActionResult` so callers keep their own control
 * flow (branch on `result.error`, surface a toast, etc.). Invalidation is
 * INTRINSIC — it fires only on success (`if (!result.error) invalidate()`), so
 * a call-site can never leave the list view stale by omitting a callback. That
 * is the whole point of routing mutations through here instead of calling the
 * action directly.
 *
 * The wrapped actions are STUBS in `@/libs/actions/items` (the integration
 * seam). A fork repoints that import at its real actions; the
 * wrap→check→invalidate body stays identical.
 */
export function useItemMutations() {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
  }, [queryClient]);

  const createItem = useCallback(async (input: CreateItemInput) => {
    const result = await createItemAction(input);
    if (!result.error) {
      invalidate();
    }
    return result;
  }, [invalidate]);

  const deleteItem = useCallback(async (id: string) => {
    const result = await deleteItemAction(id);
    if (!result.error) {
      invalidate();
    }
    return result;
  }, [invalidate]);

  return { createItem, deleteItem };
}
