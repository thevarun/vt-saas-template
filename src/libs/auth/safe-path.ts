/**
 * Pure, dependency-free open-redirect guard for user-controlled redirect paths.
 *
 * Deliberately has NO imports — in particular nothing from `next/headers`,
 * `next/navigation`, or any server-only module — so it is safe to import from
 * client components (e.g. the sign-in form) as well as route handlers and
 * server modules. Keep it that way: anything that pulls in server-only code
 * belongs in `auth-redirects.ts`, which re-exports these helpers for callers
 * that already live on the server.
 *
 * The hole this closes: guarding a redirect target with only `value.startsWith('/')`
 * lets `/\evil.com` (and `//evil.com`, `/\/evil.com`) through, and
 * `new URL('/\\evil.com', base)` normalizes those to an *external* origin
 * (`http://evil.com/`). A path is only safe to feed into `new URL(path, origin)`
 * or `${origin}${path}` if it can never re-point the origin.
 */

const WHITESPACE_RE = /\s/;

/** True if `s` contains any ASCII control char (C0 range 0x00–0x1F, or DEL 0x7F). */
function hasControlChar(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code <= 0x1F || code === 0x7F) {
      return true;
    }
  }
  return false;
}

/**
 * Returns `true` only for a same-origin internal path:
 *  - must start with exactly one `/` (rejects `//…` and `/\…` protocol-relative
 *    / backslash-normalized targets),
 *  - must contain NO backslash anywhere (a backslash is treated as `/` by the
 *    WHATWG URL parser, so `/foo\bar.com` can normalize to an external host),
 *  - must contain NO whitespace anywhere (tabs/newlines/spaces are silently
 *    stripped or re-encoded by the parser and enable smuggling), and
 *  - must contain NO ASCII control character anywhere.
 *
 * It does not attempt to validate that the path resolves to a real route —
 * only that it cannot escape the current origin.
 */
export function isSafeInternalPath(p: string | null | undefined): boolean {
  if (typeof p !== 'string' || p.length === 0) {
    return false;
  }

  // Must start with a single leading slash. Reject `//` (protocol-relative)
  // and `/\` (backslash is normalized to `/` by the URL parser).
  if (p[0] !== '/' || p[1] === '/' || p[1] === '\\') {
    return false;
  }

  if (p.includes('\\')) {
    return false;
  }

  if (WHITESPACE_RE.test(p) || hasControlChar(p)) {
    return false;
  }

  return true;
}

/**
 * Returns `p` when {@link isSafeInternalPath} accepts it, otherwise `fallback`.
 * Use this everywhere a user-controlled path is about to be fed into a redirect
 * sink (`new URL(path, origin)`, `${origin}${path}`, `router.push(path)`).
 *
 * @param p the candidate path (typically from a `next`/`redirect` query param).
 * @param fallback a known-safe internal path (e.g. `/${locale}/dashboard` or `/`).
 */
export function toSafeInternalPath(p: string | null | undefined, fallback: string): string {
  return isSafeInternalPath(p) ? (p as string) : fallback;
}
