import { describe, expect, it } from 'vitest';

import { queryKeys } from './keys';

describe('queryKeys', () => {
  it('exposes a stable list key', () => {
    expect(queryKeys.items.all).toEqual(['items']);
  });

  it('builds a parameterized detail key', () => {
    expect(queryKeys.items.detail('abc')).toEqual(['item', 'abc']);
  });
});
