import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The barrel selects the provider at module load from Env.SEARCH_PROVIDER, so
// each test mutates the mocked Env, resets the module registry, and re-imports
// `search` to exercise the chosen branch.

vi.mock('@/libs/Env', () => ({
  Env: {
    SEARCH_PROVIDER: 'tavily' as 'tavily' | 'perplexity',
    TAVILY_API_KEY: 'tvly-test-key' as string | undefined,
    PERPLEXITY_API_KEY: 'pplx-test-key' as string | undefined,
  },
}));

vi.mock('@/libs/Logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

type MockEnv = {
  SEARCH_PROVIDER: 'tavily' | 'perplexity';
  TAVILY_API_KEY: string | undefined;
  PERPLEXITY_API_KEY: string | undefined;
};

async function loadSearchWith(provider: 'tavily' | 'perplexity') {
  vi.resetModules();
  const { Env } = await import('@/libs/Env');
  (Env as unknown as MockEnv).SEARCH_PROVIDER = provider;
  const mod = await import('./index');
  return mod.search;
}

describe('search barrel', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  afterEach(() => vi.restoreAllMocks());

  it('exports a callable function (guards the undefined-provider regression)', async () => {
    const search = await loadSearchWith('tavily');

    expect(typeof search).toBe('function');
  });

  it('routes to Tavily when SEARCH_PROVIDER=tavily', async () => {
    const search = await loadSearchWith('tavily');

    await search('q');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.tavily.com/search',
      expect.anything(),
    );
  });

  it('routes to Perplexity when SEARCH_PROVIDER=perplexity', async () => {
    const search = await loadSearchWith('perplexity');

    await search('q');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.perplexity.ai/search',
      expect.anything(),
    );
  });
});
