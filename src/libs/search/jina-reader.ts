/**
 * Jina Reader — fetches the readable full-text of a web page via r.jina.ai.
 *
 * Free tier requires no API key. Use it to deepen research context: after a
 * search returns snippets, fetch the actual article body for the top-ranked
 * results so a downstream consumer has more than just titles + summaries.
 *
 * Each call is timeboxed and best-effort — a failure for one URL must not
 * derail the rest of the pipeline.
 */

import { logger } from '@/libs/Logger';

const JINA_TIMEOUT_MS = 8000;
const MAX_BODY_CHARS = 6000;

/** Compose the r.jina.ai reader URL for a target page. */
function buildReaderUrl(target: string): string {
  return `https://r.jina.ai/${target}`;
}

/**
 * Fetch readable body for a URL. Returns null on any failure (timeout, non-2xx,
 * network error). The caller is responsible for falling back to the snippet.
 */
export async function fetchArticleBody(url: string): Promise<string | null> {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), JINA_TIMEOUT_MS);

  try {
    const res = await fetch(buildReaderUrl(url), {
      headers: {
        'Accept': 'text/plain',
        'X-Return-Format': 'text',
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      logger.warn({ url, status: res.status }, 'jina-reader: non-2xx response');
      return null;
    }

    const text = await res.text();
    if (!text || text.length < 200) {
      return null;
    }

    return text.length > MAX_BODY_CHARS ? `${text.slice(0, MAX_BODY_CHARS)}…` : text;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      logger.warn({ url }, 'jina-reader: timeout');
    } else {
      logger.warn({ err, url }, 'jina-reader: fetch failed');
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch bodies for an ordered list of URLs in parallel, returning a map
 * keyed by URL. Missing entries indicate a failed fetch — the caller can
 * fall back to the snippet from search.
 */
export async function fetchArticleBodies(urls: string[]): Promise<Map<string, string>> {
  const bodies = new Map<string, string>();
  if (urls.length === 0) {
    return bodies;
  }

  const results = await Promise.all(
    urls.map(async url => ({ url, body: await fetchArticleBody(url) })),
  );

  for (const { url, body } of results) {
    if (body) {
      bodies.set(url, body);
    }
  }

  return bodies;
}
