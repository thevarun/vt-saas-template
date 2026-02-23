/**
 * Simple in-memory IP-based rate limiter.
 * Suitable for single-instance deployments.
 * For multi-instance, replace with Redis-backed implementation.
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leaks (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;

if (typeof globalThis.setInterval === 'function') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count++;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]!.trim();
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

/** Reset the rate limit store (for testing purposes only). */
export function _resetStore(): void {
  store.clear();
}
