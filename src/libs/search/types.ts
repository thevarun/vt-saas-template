/** Standardized search result from any web search provider. */
export type SearchResult = {
  title: string;
  url: string;
  /** Snippet or summary of the search result content. */
  content: string;
  /** Relevance score (0-1), if provided by the search provider. */
  score?: number;
};

/** Options for controlling search behavior. */
export type SearchOptions = {
  /** Maximum number of results to return (default: 5). */
  maxResults?: number;
  /** Topic category for the search (default: 'general'). */
  topic?: 'general' | 'news';
  /** Filter results by recency. Maps to provider-specific params. */
  recencyFilter?: 'day' | 'week' | 'month' | 'year';
};

/**
 * Contract for a web search backend. Swap backends (Tavily, Perplexity, Serper,
 * Brave, …) by exporting a function with this shape — no object wrapper needed
 * since providers are stateless.
 */
export type SearchFn = (query: string, options?: SearchOptions) => Promise<SearchResult[]>;
