import { describe, expect, it } from 'vitest';

import { isSafeInternalPath, toSafeInternalPath } from './safe-path';

// Inputs that must NEVER be honoured as a same-origin redirect target. Each one
// either is, or normalizes to, an external origin / a smuggling vector. Control
// chars are built via String.fromCharCode to keep this source ASCII-clean.
const NUL = String.fromCharCode(0);
const DEL = String.fromCharCode(127);

const MALICIOUS_INPUTS: ReadonlyArray<string | null | undefined> = [
  '/\\evil.com', // backslash -> URL parser treats it as `/`, yields http://evil.com
  '/\\/evil.com', // backslash + slash
  '//evil.com', // protocol-relative
  'https://evil.com', // absolute external
  'http://evil.com', // absolute external
  'evil.com', // no leading slash
  '/foo\\bar', // embedded backslash
  '/foo bar', // embedded space
  '/foo\tbar', // tab
  '/foo\nbar', // line feed (CR/LF smuggling)
  '/foo\rbar', // carriage return
  `/foo${NUL}bar`, // NUL control char
  `/foo${DEL}bar`, // DEL control char
  '\\evil.com', // leading backslash
  '', // empty
  null,
  undefined,
];

// Inputs that must PASS — genuine same-origin internal paths.
const SAFE_INPUTS: readonly string[] = [
  '/en/dashboard',
  '/dashboard',
  '/',
  '/en/settings?tab=billing',
  '/en/onboarding#step-2',
  '/%2F%2Fevil.com', // percent-encoded — stays a literal path segment, never an origin
];

describe('isSafeInternalPath', () => {
  it.each(MALICIOUS_INPUTS)('rejects malicious input %j', (input) => {
    expect(isSafeInternalPath(input)).toBe(false);
  });

  it.each(SAFE_INPUTS)('accepts safe internal path %j', (input) => {
    expect(isSafeInternalPath(input)).toBe(true);
  });
});

describe('toSafeInternalPath', () => {
  it.each(MALICIOUS_INPUTS)('collapses malicious input %j to the fallback', (input) => {
    expect(toSafeInternalPath(input, '/safe')).toBe('/safe');
  });

  it.each(SAFE_INPUTS)('returns the value unchanged for safe input %j', (input) => {
    expect(toSafeInternalPath(input, '/safe')).toBe(input);
  });
});

describe('toSafeInternalPath closes the open-redirect hole (origin proof)', () => {
  // The whole point: after sanitizing, feeding the result into `new URL(path, base)`
  // can NEVER resolve to an external origin. This is the exact sink shape used by
  // every auth redirect route (`new URL(safePath, request.url)`).
  const BASE = 'http://localhost:3000';

  it.each(MALICIOUS_INPUTS)('never resolves to an external origin for %j', (input) => {
    const safe = toSafeInternalPath(input, '/safe');
    const resolved = new URL(safe, BASE);

    expect(resolved.origin).toBe(BASE);
  });

  it('the raw (unsanitized) backslash payload DOES escape — proving the guard matters', () => {
    // Sanity check that our test fixture is actually dangerous without the guard.
    expect(new URL('/\\evil.com', BASE).origin).toBe('http://evil.com');
  });

  it.each(SAFE_INPUTS)('keeps the intended origin for legitimate path %j', (input) => {
    expect(new URL(toSafeInternalPath(input, '/safe'), BASE).origin).toBe(BASE);
  });
});
