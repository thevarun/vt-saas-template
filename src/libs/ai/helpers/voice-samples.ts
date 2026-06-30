/**
 * Voice-sample loader for prompt calibration.
 *
 * Loads a user's recent artifacts (published posts, generated docs, …) to use as
 * voice reference samples in a generation prompt. The product-specific DB query
 * is injected as a {@link VoiceSampleFetcher}, so this stays decoupled from any
 * particular table/schema — wire it to a Supabase-JS query at the call site.
 *
 * The loader owns the generic calibration logic:
 *  - scoped → unscoped fallback (try a style/category-filtered query first, then
 *    fall back to any recent artifact)
 *  - word-cap truncation so a few long samples can't blow the prompt budget
 */

export type VoiceSample = { content: string };

/**
 * Pluggable fetcher injected by the caller.
 *
 * @param userId  The user whose recent artifacts to load.
 * @param scopeId Optional scope to filter by first (e.g. a style/category id).
 *                When null/undefined, return the user's most recent artifacts.
 * @param limit   Max rows to return.
 */
export type VoiceSampleFetcher = (
  userId: string,
  scopeId: string | null | undefined,
  limit: number,
) => Promise<{ content: string | null }[] | null>;

const DEFAULT_WORD_LIMIT = 250;
const DEFAULT_LIMIT = 5;
const WHITESPACE_RE = /\s+/;

/** Truncate text to approximately `maxWords` words. */
function truncateWords(text: string, maxWords: number): string {
  const words = text.split(WHITESPACE_RE);
  if (words.length <= maxWords) {
    return text;
  }
  return `${words.slice(0, maxWords).join(' ')}…`;
}

/** Map raw rows to VoiceSample[], dropping empty content and capping word count. */
function toVoiceSamples(
  data: { content: string | null }[] | null,
  wordLimit: number,
): VoiceSample[] {
  if (!data || data.length === 0) {
    return [];
  }
  return data
    .filter((row): row is { content: string } => Boolean(row.content))
    .map(row => ({ content: truncateWords(row.content, wordLimit) }));
}

export type LoadVoiceSamplesOptions = {
  /** Optional scope (e.g. style/category id) to filter by before falling back. */
  scopeId?: string | null;
  /** Max samples to load (default: 5). */
  limit?: number;
  /** Per-sample word cap (default: 250). */
  wordLimit?: number;
};

/**
 * Load a user's recent artifacts as voice reference samples.
 *
 * When `scopeId` is provided, queries that scope first; if it yields nothing,
 * falls back to the user's most recent artifacts across any scope. Returns an
 * empty array for first-time users with no artifacts.
 */
export async function loadVoiceSamples(
  fetcher: VoiceSampleFetcher,
  userId: string,
  options: LoadVoiceSamplesOptions = {},
): Promise<VoiceSample[]> {
  const { scopeId, limit = DEFAULT_LIMIT, wordLimit = DEFAULT_WORD_LIMIT } = options;

  // Try the scoped query first
  if (scopeId) {
    const scoped = toVoiceSamples(await fetcher(userId, scopeId, limit), wordLimit);
    if (scoped.length > 0) {
      return scoped;
    }
  }

  // Fallback: any recent artifact by this user
  return toVoiceSamples(await fetcher(userId, null, limit), wordLimit);
}
