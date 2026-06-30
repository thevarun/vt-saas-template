import { describe, expect, it, vi } from 'vitest';

import type { ItemFetchClient } from './item';
import { fetchItem, fetchItems, itemQueryKey } from './item';

// Builds a supabase-js-shaped client whose `.single()` resolves to the given
// `{ data, error }`. Only the chain `fetchItem` actually calls is mocked.
function mockClient(result: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { client: { from } as unknown as ItemFetchClient, from, select, eq, single };
}

// Builds a client whose `.order()` resolves the list result `fetchItems` reads.
function mockListClient(result: { data: unknown; error: unknown }) {
  const order = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ order });
  const from = vi.fn().mockReturnValue({ select });
  return { client: { from } as unknown as ItemFetchClient, from, select, order };
}

describe('fetchItem', () => {
  it('returns null when no row is found (PGRST116)', async () => {
    const { client } = mockClient({ data: null, error: { code: 'PGRST116' } });

    await expect(fetchItem(client, 'missing')).resolves.toBeNull();
  });

  it('maps a row when present', async () => {
    const row = { id: '1', name: 'Widget', description: null, created_at: '2026-01-01' };
    const { client, from, eq } = mockClient({ data: row, error: null });

    const result = await fetchItem(client, '1');

    expect(result).toEqual(row);
    expect(from).toHaveBeenCalledWith('items');
    expect(eq).toHaveBeenCalledWith('id', '1');
  });

  it('throws on a non-not-found error', async () => {
    const { client } = mockClient({ data: null, error: { code: '500', message: 'boom' } });

    await expect(fetchItem(client, '1')).rejects.toMatchObject({ code: '500' });
  });
});

describe('fetchItems', () => {
  it('returns the rows ordered by the query', async () => {
    const rows = [{ id: '1', name: 'Widget', description: null, created_at: '2026-01-01' }];
    const { client, from, order } = mockListClient({ data: rows, error: null });

    const result = await fetchItems(client);

    expect(result).toEqual(rows);
    expect(from).toHaveBeenCalledWith('items');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('returns an empty array when data is null', async () => {
    const { client } = mockListClient({ data: null, error: null });

    await expect(fetchItems(client)).resolves.toEqual([]);
  });

  it('throws on error', async () => {
    const { client } = mockListClient({ data: null, error: { code: '500', message: 'boom' } });

    await expect(fetchItems(client)).rejects.toMatchObject({ code: '500' });
  });
});

describe('itemQueryKey', () => {
  it('delegates to the centralized key factory', () => {
    expect(itemQueryKey('1')).toEqual(['item', '1']);
  });
});
