import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SearchResult } from './types';

// Mock the Env module before importing perplexity
vi.mock('@/libs/Env', () => ({
  Env: {
    PERPLEXITY_API_KEY: undefined as string | undefined,
  },
}));

// Mock the logger module so tests can assert on its methods
vi.mock('@/libs/Logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('perplexity searchWeb', () => {
  let searchWeb: typeof import('./perplexity').searchWeb;
  let mockEnv: { PERPLEXITY_API_KEY: string | undefined };

  beforeEach(async () => {
    // Get reference to the mocked Env
    const envModule = await import('@/libs/Env');
    mockEnv = envModule.Env as unknown as { PERPLEXITY_API_KEY: string | undefined };

    // Re-import perplexity to get fresh module
    const perplexityModule = await import('./perplexity');
    searchWeb = perplexityModule.searchWeb;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty array when PERPLEXITY_API_KEY is not set', async () => {
    mockEnv.PERPLEXITY_API_KEY = undefined;

    const results = await searchWeb('test query');

    expect(results).toEqual([]);
  });

  it('returns empty array when PERPLEXITY_API_KEY is empty string', async () => {
    mockEnv.PERPLEXITY_API_KEY = '';

    const results = await searchWeb('test query');

    expect(results).toEqual([]);
  });

  it('calls Perplexity API with correct URL, headers, and body when key is set', async () => {
    mockEnv.PERPLEXITY_API_KEY = 'pplx-test-key';

    const mockResponse: { results: Array<{ title: string; url: string; snippet: string }> } = {
      results: [
        {
          title: 'Test Article',
          url: 'https://example.com/article',
          snippet: 'This is a test article about AI trends.',
        },
        {
          title: 'Another Article',
          url: 'https://example.com/another',
          snippet: 'Another article about leadership.',
        },
      ],
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const results = await searchWeb('AI trends 2026', { maxResults: 5 });

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.perplexity.ai/search',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer pplx-test-key',
        },
        body: JSON.stringify({
          query: 'AI trends 2026',
          max_results: 5,
        }),
      }),
    );

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      title: 'Test Article',
      url: 'https://example.com/article',
      content: 'This is a test article about AI trends.',
    });
  });

  it('maps snippet to content in results', async () => {
    mockEnv.PERPLEXITY_API_KEY = 'pplx-test-key';

    const mockResponse = {
      results: [
        {
          title: 'Article',
          url: 'https://example.com',
          snippet: 'The snippet text.',
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const results = await searchWeb('test');

    expect(results[0]!.content).toBe('The snippet text.');
  });

  it('uses correct defaults when no options provided', async () => {
    mockEnv.PERPLEXITY_API_KEY = 'pplx-test-key';

    const mockResponse = { results: [] };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await searchWeb('test query');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.perplexity.ai/search',
      expect.objectContaining({
        body: JSON.stringify({
          query: 'test query',
          max_results: 5,
        }),
      }),
    );
  });

  it('returns empty array on fetch error', async () => {
    mockEnv.PERPLEXITY_API_KEY = 'pplx-test-key';

    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));
    const { logger } = await import('@/libs/Logger');

    const results = await searchWeb('test query');

    expect(results).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(Error) }),
      'Perplexity search failed',
    );
  });

  it('returns empty array on non-OK response', async () => {
    mockEnv.PERPLEXITY_API_KEY = 'pplx-test-key';

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Internal Server Error', { status: 500 }),
    );
    const { logger } = await import('@/libs/Logger');

    const results: SearchResult[] = await searchWeb('test query');

    expect(results).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      'Perplexity API error',
    );
  });
});
