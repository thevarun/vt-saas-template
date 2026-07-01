import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SearchResult } from './types';

// Mock the Env module before importing tavily
vi.mock('@/libs/Env', () => ({
  Env: {
    TAVILY_API_KEY: undefined as string | undefined,
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

describe('tavily searchWeb', () => {
  let searchWeb: typeof import('./tavily').searchWeb;
  let mockEnv: { TAVILY_API_KEY: string | undefined };

  beforeEach(async () => {
    // Get reference to the mocked Env
    const envModule = await import('@/libs/Env');
    mockEnv = envModule.Env as unknown as { TAVILY_API_KEY: string | undefined };

    // Re-import tavily to get fresh module
    const tavilyModule = await import('./tavily');
    searchWeb = tavilyModule.searchWeb;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty array when TAVILY_API_KEY is not set', async () => {
    mockEnv.TAVILY_API_KEY = undefined;

    const results = await searchWeb('test query');

    expect(results).toEqual([]);
  });

  it('returns empty array when TAVILY_API_KEY is empty string', async () => {
    mockEnv.TAVILY_API_KEY = '';

    const results = await searchWeb('test query');

    expect(results).toEqual([]);
  });

  it('calls Tavily API with correct request body when key is set', async () => {
    mockEnv.TAVILY_API_KEY = 'tvly-test-key';

    const mockResponse: { results: SearchResult[] } = {
      results: [
        {
          title: 'Test Article',
          url: 'https://example.com/article',
          content: 'This is a test article about AI trends.',
          score: 0.95,
        },
        {
          title: 'Another Article',
          url: 'https://example.com/another',
          content: 'Another article about leadership.',
          score: 0.88,
        },
      ],
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const results = await searchWeb('AI trends 2026', { maxResults: 5, topic: 'news' });

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.tavily.com/search',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: 'tvly-test-key',
          query: 'AI trends 2026',
          max_results: 5,
          topic: 'news',
        }),
      }),
    );

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      title: 'Test Article',
      url: 'https://example.com/article',
      content: 'This is a test article about AI trends.',
      score: 0.95,
    });
  });

  it('uses default options when none provided', async () => {
    mockEnv.TAVILY_API_KEY = 'tvly-test-key';

    const mockResponse = { results: [] };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await searchWeb('test query');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.tavily.com/search',
      expect.objectContaining({
        body: JSON.stringify({
          api_key: 'tvly-test-key',
          query: 'test query',
          max_results: 5,
          topic: 'general',
        }),
      }),
    );
  });

  it('returns empty array on fetch error', async () => {
    mockEnv.TAVILY_API_KEY = 'tvly-test-key';

    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));
    const { logger } = await import('@/libs/Logger');

    const results = await searchWeb('test query');

    expect(results).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(Error) }),
      'Tavily search failed',
    );
  });

  it('returns empty array on non-OK response', async () => {
    mockEnv.TAVILY_API_KEY = 'tvly-test-key';

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Internal Server Error', { status: 500 }),
    );
    const { logger } = await import('@/libs/Logger');

    const results = await searchWeb('test query');

    expect(results).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      'Tavily API error',
    );
  });
});
