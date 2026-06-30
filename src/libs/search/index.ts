/**
 * Web Search Barrel
 *
 * Exports the active search function, chosen from SEARCH_PROVIDER at module
 * load (default: 'tavily'; alternative: 'perplexity').
 *
 * Static ESM imports only — a previous lazy `require()` indirection dropped its
 * named export under the production Turbopack bundle's ESM↔CJS interop, leaving
 * the provider `undefined`. Providers are stateless functions, so eagerly
 * importing both is free and bundler-safe.
 */

import { Env } from '@/libs/Env';

import { searchWeb as perplexitySearch } from './perplexity';
import { searchWeb as tavilySearch } from './tavily';
import type { SearchFn } from './types';

export type { SearchFn, SearchOptions, SearchResult } from './types';

export const search: SearchFn
  = Env.SEARCH_PROVIDER === 'tavily' ? tavilySearch : perplexitySearch;
