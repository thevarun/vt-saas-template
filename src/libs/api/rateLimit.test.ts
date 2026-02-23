import { beforeEach, describe, expect, it } from 'vitest';

import { _resetStore, checkRateLimit, getClientIp } from './rateLimit';

describe('rateLimit', () => {
  beforeEach(() => {
    _resetStore();
  });

  describe('checkRateLimit', () => {
    it('allows requests under the limit', () => {
      const result1 = checkRateLimit('test-key', 3, 60000);

      expect(result1.allowed).toBe(true);
      expect(result1.retryAfterSeconds).toBe(0);

      const result2 = checkRateLimit('test-key', 3, 60000);

      expect(result2.allowed).toBe(true);

      const result3 = checkRateLimit('test-key', 3, 60000);

      expect(result3.allowed).toBe(true);
    });

    it('blocks requests at the limit and returns correct retryAfterSeconds', () => {
      // Use up all 2 allowed requests
      checkRateLimit('test-key', 2, 60000);
      checkRateLimit('test-key', 2, 60000);

      // 3rd request should be blocked
      const result = checkRateLimit('test-key', 2, 60000);

      expect(result.allowed).toBe(false);
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
      expect(result.retryAfterSeconds).toBeLessThanOrEqual(60);
    });

    it('resets after window expires', () => {
      // Use a very short window (1ms)
      checkRateLimit('test-key', 1, 1);

      // Wait for window to expire
      // Since the window is 1ms, the next call should have the window expired
      // We'll simulate by using a fresh key to avoid timing issues
      // Actually, let's use a direct approach: set count to max, then check after resetAt
      const result1 = checkRateLimit('expire-test', 1, 1);

      expect(result1.allowed).toBe(true);

      // The window of 1ms should have expired by now
      // Force a small delay via synchronous operation
      const start = Date.now();
      while (Date.now() - start < 5) { /* wait */ }

      const result2 = checkRateLimit('expire-test', 1, 1);

      expect(result2.allowed).toBe(true);
    });

    it('tracks different keys independently', () => {
      checkRateLimit('key-a', 1, 60000);
      const resultA = checkRateLimit('key-a', 1, 60000);

      expect(resultA.allowed).toBe(false);

      // Different key should still be allowed
      const resultB = checkRateLimit('key-b', 1, 60000);

      expect(resultB.allowed).toBe(true);
    });
  });

  describe('getClientIp', () => {
    it('extracts IP from x-forwarded-for header (first IP only)', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8, 9.10.11.12' },
      });

      expect(getClientIp(request)).toBe('1.2.3.4');
    });

    it('extracts single IP from x-forwarded-for', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      expect(getClientIp(request)).toBe('1.2.3.4');
    });

    it('falls back to x-real-ip', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '10.0.0.1' },
      });

      expect(getClientIp(request)).toBe('10.0.0.1');
    });

    it('returns "unknown" when no IP headers present', () => {
      const request = new Request('http://localhost');

      expect(getClientIp(request)).toBe('unknown');
    });

    it('prefers x-forwarded-for over x-real-ip', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '1.2.3.4',
          'x-real-ip': '10.0.0.1',
        },
      });

      expect(getClientIp(request)).toBe('1.2.3.4');
    });
  });
});
