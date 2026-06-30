import { queryKeys } from '@/libs/queries/keys';
import type { createClient as createBrowserClient } from '@/libs/supabase/client';
import type { createClient as createServerClient } from '@/libs/supabase/server';

/**
 * Server-safe fetch-function pattern (generic `item` exemplar).
 *
 * The fetch functions (`fetchItem`, `fetchItems`) and the client hooks
 * (`src/libs/hooks/use-item.ts`) share the SAME keys (`itemQueryKey`,
 * `queryKeys.items.all`) and the SAME row shape (`ItemRow`). Because this module
 * has no `'use client'` directive, an RSC can import either fetch function to
 * prefetch on the server and hand the client the identical key/shape it will
 * read — killing SSR hydration mismatches.
 *
 * `item` is a placeholder entity. A fork points `.from('items')` at a real
 * table and copies this file per entity.
 */

// Local row type + cast (NOT `TableRow<'items'>`): the generated
// `src/libs/supabase/types.ts` is a placeholder stub with no real tables, so the
// supabase clients are not schema-typed. Declaring the row shape here keeps this
// example compiling against the stub. Once a fork generates real types it can
// switch to `TableRow<'items'>`.
export type ItemRow = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export const itemQueryKey = (id: string) => queryKeys.items.detail(id);

export type ItemFetchClient
  = | ReturnType<typeof createBrowserClient>
    | ReturnType<typeof createServerClient>;

// Shared projection so the single- and list-fetch functions (and any RSC
// prefetch) read the identical column set.
const ITEM_COLUMNS = 'id, name, description, created_at';

export async function fetchItem(
  supabase: ItemFetchClient,
  id: string,
): Promise<ItemRow | null> {
  const { data, error } = await supabase
    .from('items')
    .select(ITEM_COLUMNS)
    .eq('id', id)
    .single();

  if (error) {
    // PGRST116 = "no rows" from `.single()` → treat as not-found, not an error.
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data as ItemRow | null;
}

export async function fetchItems(
  supabase: ItemFetchClient,
): Promise<ItemRow[]> {
  const { data, error } = await supabase
    .from('items')
    .select(ITEM_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ItemRow[];
}
