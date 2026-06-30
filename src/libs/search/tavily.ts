/**
 * Tavily Web Search Provider
 *
 * Implements the SearchFn contract using the Tavily Search API.
 * Returns empty array when TAVILY_API_KEY is not configured (graceful degradation).
 *
 * @see https://docs.tavily.com/documentation/api-reference/search
 */

import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';

import type { SearchOptions, SearchResult } from './types';

/** Tavily API response shape (subset of fields we use). */
type TavilyResponse = {
  results: Array<{
    title: string;
    url: string;
    content: string;
    score?: number;
  }>;
};

/**
 * Search the web using Tavily API.
 *
 * Returns an empty array when:
 * - TAVILY_API_KEY is not set (no-op, graceful degradation)
 * - API call fails (network error, server error)
 */
export async function searchWeb(
  query: string,
  options?: SearchOptions,
): Promise<SearchResult[]> {
  if (!Env.TAVILY_API_KEY) {
    return [];
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: Env.TAVILY_API_KEY,
        query,
        max_results: options?.maxResults ?? 5,
        topic: options?.topic ?? 'general',
        ...(options?.recencyFilter && { time_range: options.recencyFilter }),
      }),
    });

    if (!response.ok) {
      logger.error({ status: response.status, statusText: response.statusText }, 'Tavily API error');
      return [];
    }

    const data: TavilyResponse = await response.json();

    return data.results.map(r => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
    }));
  } catch (error) {
    logger.error({ error }, 'Tavily search failed');
    return [];
  }
}
