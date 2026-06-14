/**
 * Perplexity Web Search Provider
 *
 * Implements the SearchFn contract using the Perplexity Search API.
 * Returns empty array when PERPLEXITY_API_KEY is not configured (graceful degradation).
 *
 * @see https://docs.perplexity.ai/api-reference/search
 */

import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';

import type { SearchOptions, SearchResult } from './types';

/** Perplexity Search API response shape (subset of fields we use). */
type PerplexityResponse = {
  results: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
};

export async function searchWeb(
  query: string,
  options?: SearchOptions,
): Promise<SearchResult[]> {
  if (!Env.PERPLEXITY_API_KEY) {
    return [];
  }

  try {
    const response = await fetch('https://api.perplexity.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Env.PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        max_results: options?.maxResults ?? 5,
        ...(options?.recencyFilter && { search_recency_filter: options.recencyFilter }),
      }),
    });

    if (!response.ok) {
      logger.error({ status: response.status, statusText: response.statusText }, 'Perplexity API error');
      return [];
    }

    const data: PerplexityResponse = await response.json();

    return data.results.map(r => ({
      title: r.title,
      url: r.url,
      content: r.snippet,
    }));
  } catch (error) {
    logger.error({ error }, 'Perplexity search failed');
    return [];
  }
}
