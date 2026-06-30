import { describe, expect, it, vi } from 'vitest';

import type { VoiceSampleFetcher } from './voice-samples';
import { loadVoiceSamples } from './voice-samples';

describe('loadVoiceSamples', () => {
  it('returns empty array when the user has no artifacts', async () => {
    const fetcher: VoiceSampleFetcher = vi.fn(async () => []);

    const result = await loadVoiceSamples(fetcher, 'u1');

    expect(result).toEqual([]);
  });

  it('drops rows with null/empty content', async () => {
    const fetcher: VoiceSampleFetcher = vi.fn(async () => [
      { content: 'real content' },
      { content: null },
      { content: '' },
    ]);

    const result = await loadVoiceSamples(fetcher, 'u1');

    expect(result).toEqual([{ content: 'real content' }]);
  });

  it('truncates content past the word cap with an ellipsis', async () => {
    const longText = Array.from({ length: 300 }, (_, i) => `w${i}`).join(' ');
    const fetcher: VoiceSampleFetcher = vi.fn(async () => [{ content: longText }]);

    const [sample] = await loadVoiceSamples(fetcher, 'u1', { wordLimit: 10 });

    expect(sample?.content.endsWith('…')).toBe(true);
    expect(sample?.content.split(' ')).toHaveLength(10);
  });

  it('does not truncate content within the word cap', async () => {
    const fetcher: VoiceSampleFetcher = vi.fn(async () => [{ content: 'short and sweet' }]);

    const [sample] = await loadVoiceSamples(fetcher, 'u1', { wordLimit: 10 });

    expect(sample?.content).toBe('short and sweet');
  });

  it('uses scoped results when the scoped query returns rows', async () => {
    const fetcher = vi.fn(async (_userId, scopeId) =>
      scopeId === 'style-1' ? [{ content: 'scoped sample' }] : [{ content: 'unscoped sample' }],
    ) satisfies VoiceSampleFetcher;

    const result = await loadVoiceSamples(fetcher, 'u1', { scopeId: 'style-1' });

    expect(result).toEqual([{ content: 'scoped sample' }]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith('u1', 'style-1', 5);
  });

  it('falls back to unscoped when the scoped query is empty', async () => {
    const fetcher = vi.fn(async (_userId, scopeId) =>
      scopeId === 'style-1' ? [] : [{ content: 'unscoped sample' }],
    ) satisfies VoiceSampleFetcher;

    const result = await loadVoiceSamples(fetcher, 'u1', { scopeId: 'style-1' });

    expect(result).toEqual([{ content: 'unscoped sample' }]);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher).toHaveBeenLastCalledWith('u1', null, 5);
  });

  it('skips the scoped query entirely when no scopeId is given', async () => {
    const fetcher = vi.fn(async () => [{ content: 'unscoped sample' }]) satisfies VoiceSampleFetcher;

    await loadVoiceSamples(fetcher, 'u1');

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith('u1', null, 5);
  });

  it('passes a custom limit through to the fetcher', async () => {
    const fetcher = vi.fn(async () => []) satisfies VoiceSampleFetcher;

    await loadVoiceSamples(fetcher, 'u1', { limit: 3 });

    expect(fetcher).toHaveBeenCalledWith('u1', null, 3);
  });
});
