// @vitest-environment jsdom
/**
 * Tests for Referral Tracking Utilities
 */

import { beforeEach, describe, expect, it } from 'vitest';

import {
  captureReferralParams,
  clearReferralInfo,
  extractUtmParams,
  getReferralInfo,
} from '../referral';

describe('referral utilities', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
    // Reset window.location
    delete (window as any).location;
    (window as any).location = { search: '', href: 'http://localhost/' };
  });

  describe('extractUtmParams', () => {
    it('extracts all UTM parameters', () => {
      window.location.search
        = '?utm_source=google&utm_medium=cpc&utm_campaign=spring_sale&utm_content=ad1&utm_term=shoes';

      const params = extractUtmParams();

      expect(params).toEqual({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'spring_sale',
        utm_content: 'ad1',
        utm_term: 'shoes',
      });
    });

    it('extracts only present UTM parameters', () => {
      window.location.search = '?utm_source=facebook&utm_campaign=summer';

      const params = extractUtmParams();

      expect(params).toEqual({
        utm_source: 'facebook',
        utm_campaign: 'summer',
      });
    });

    it('returns empty object when no UTM parameters', () => {
      window.location.search = '?other=value';

      const params = extractUtmParams();

      expect(params).toEqual({});
    });

    it('sanitizes parameter values', () => {
      window.location.search = '?utm_source=<script>alert("xss")</script>';

      const params = extractUtmParams();

      expect(params.utm_source).toBe('scriptalert(xss)/script');
      expect(params.utm_source).not.toContain('<');
      expect(params.utm_source).not.toContain('>');
    });

    it('limits parameter length', () => {
      const longValue = 'a'.repeat(150);
      window.location.search = `?utm_source=${longValue}`;

      const params = extractUtmParams();

      expect(params.utm_source?.length).toBeLessThanOrEqual(100);
    });
  });

  describe('captureReferralParams', () => {
    it('captures ref parameter', () => {
      window.location.search = '?ref=friend123';

      captureReferralParams();

      const info = getReferralInfo();

      expect(info?.source).toBe('friend123');
    });

    it('captures referrer parameter', () => {
      window.location.search = '?referrer=partner-abc';

      captureReferralParams();

      const info = getReferralInfo();

      expect(info?.source).toBe('partner-abc');
    });

    it('extracts user ID from user-{id} format', () => {
      window.location.search = '?ref=user-456';

      captureReferralParams();

      const info = getReferralInfo();

      expect(info?.source).toBe('user-456');
      expect(info?.userId).toBe('456');
    });

    it('falls back to utm_source if no ref parameter', () => {
      window.location.search = '?utm_source=google&utm_medium=cpc';

      captureReferralParams();

      const info = getReferralInfo();

      expect(info?.source).toBe('google');
    });

    it('uses first referral parameter found', () => {
      window.location.search = '?ref=friend&referrer=partner';

      captureReferralParams();

      const info = getReferralInfo();

      expect(info?.source).toBe('friend');
    });

    it('does not override existing referral (first-touch)', () => {
      window.location.search = '?ref=first';
      captureReferralParams();

      window.location.search = '?ref=second';
      captureReferralParams();

      const info = getReferralInfo();

      expect(info?.source).toBe('first');
    });

    it('sanitizes referral parameter', () => {
      window.location.search = '?ref=<script>evil</script>';

      captureReferralParams();

      const info = getReferralInfo();

      expect(info?.source).not.toContain('<');
      expect(info?.source).not.toContain('>');
    });

    it('does not store if no referral params found', () => {
      window.location.search = '?other=value';

      captureReferralParams();

      const info = getReferralInfo();

      expect(info).toBeNull();
    });
  });

  describe('getReferralInfo', () => {
    it('returns null when no referral stored', () => {
      const info = getReferralInfo();

      expect(info).toBeNull();
    });

    it('returns stored referral info', () => {
      window.location.search = '?ref=test123';
      captureReferralParams();

      const info = getReferralInfo();

      expect(info).toEqual({ source: 'test123' });
    });

    it('returns null and clears invalid JSON', () => {
      sessionStorage.setItem('analytics_referral', 'invalid-json');

      const info = getReferralInfo();

      expect(info).toBeNull();
      expect(sessionStorage.getItem('analytics_referral')).toBeNull();
    });
  });

  describe('clearReferralInfo', () => {
    it('removes stored referral info', () => {
      window.location.search = '?ref=test';
      captureReferralParams();

      expect(getReferralInfo()).not.toBeNull();

      clearReferralInfo();

      expect(getReferralInfo()).toBeNull();
    });

    it('does not throw when nothing to clear', () => {
      expect(() => clearReferralInfo()).not.toThrow();
    });
  });
});
