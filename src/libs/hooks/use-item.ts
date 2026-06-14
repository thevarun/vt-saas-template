'use client';

import { useQuery } from '@tanstack/react-query';

import type { ItemRow } from '@/libs/queries/item';
import { fetchItem, fetchItems, itemQueryKey } from '@/libs/queries/item';
import { queryKeys } from '@/libs/queries/keys';
import { createClient } from '@/libs/supabase/client';

export type { ItemRow } from '@/libs/queries/item';

/**
 * TanStack read hooks for the generic `item` entity.
 *
 * Data hooks live under `src/libs/hooks/` (alongside the `src/libs/queries/`
 * fetch functions they wrap), distinct from `src/hooks/` which holds generic
 * React UI hooks. Each hook reuses the SAME query key and row shape as its
 * fetch function so an RSC prefetch and the client read agree by construction.
 *
 * A fork copies these → `useThing` / `useThings`, repointing at `item.ts`'s
 * sibling for the new entity.
 */

export function useItem(id: string) {
  const supabase = createClient();

  return useQuery<ItemRow | null>({
    queryKey: itemQueryKey(id),
    queryFn: () => fetchItem(supabase, id),
  });
}

export function useItems<TData = ItemRow[]>(options?: {
  select?: (rows: ItemRow[]) => TData;
}) {
  const supabase = createClient();

  return useQuery<ItemRow[], Error, TData>({
    queryKey: queryKeys.items.all,
    queryFn: () => fetchItems(supabase),
    select: options?.select,
  });
}
