import { isSafeInternalPath } from './safe-path';

/**
 * Client-side helper to ask the server where to land the user after sign-in.
 * Honours the onboarding gate — a user who hasn't completed onboarding is sent
 * to `/onboarding` instead of their requested path.
 *
 * Fails open to `fallback` if the request fails so sign-in is never blocked by
 * a network hiccup; the onboarding gate is re-checked server-side on the next
 * protected navigation anyway.
 */
export async function fetchPostAuthDestination(options: {
  locale: string;
  /** Where the caller wanted to land (usually `/{locale}/dashboard`). */
  preferredPath: string;
  /** What to return if the request fails. Defaults to `preferredPath`. */
  fallback?: string;
}): Promise<string> {
  const { locale, preferredPath, fallback } = options;
  try {
    const res = await fetch(
      `/api/auth/post-auth-destination?locale=${encodeURIComponent(locale)}&next=${encodeURIComponent(preferredPath)}`,
      { credentials: 'include' },
    );
    if (res.ok) {
      const data = (await res.json()) as { destination?: string };
      if (isSafeInternalPath(data.destination)) {
        return data.destination as string;
      }
    }
  } catch {
    // Fall through to fallback
  }
  return fallback ?? preferredPath;
}
