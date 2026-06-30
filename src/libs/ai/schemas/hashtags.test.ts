import { describe, expect, it } from 'vitest';

import { hashtagsResponseSchema } from './hashtags';

describe('hashtagsResponseSchema', () => {
  it('accepts 1 to 5 hashtags', () => {
    expect(hashtagsResponseSchema.safeParse({ hashtags: ['ai'] }).success).toBe(true);
    expect(
      hashtagsResponseSchema.safeParse({ hashtags: ['a', 'b', 'c', 'd', 'e'] }).success,
    ).toBe(true);
  });

  it('rejects an empty array', () => {
    expect(hashtagsResponseSchema.safeParse({ hashtags: [] }).success).toBe(false);
  });

  it('rejects more than 5 hashtags', () => {
    expect(
      hashtagsResponseSchema.safeParse({ hashtags: ['a', 'b', 'c', 'd', 'e', 'f'] }).success,
    ).toBe(false);
  });

  it('rejects a missing hashtags field', () => {
    expect(hashtagsResponseSchema.safeParse({}).success).toBe(false);
  });
});
