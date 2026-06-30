import { describe, expect, it } from 'vitest';

import { getCtaConfig } from './tier-cta';

describe('getCtaConfig', () => {
  it('marks the matching card as the current plan', () => {
    expect(getCtaConfig('free', 'free')).toEqual({
      label: 'Current Plan',
      variant: 'default',
      isCurrentPlan: true,
    });
    expect(getCtaConfig('pro', 'pro')).toMatchObject({ isCurrentPlan: true });
  });

  it('offers an upgrade from free to pro', () => {
    expect(getCtaConfig('free', 'pro')).toEqual({
      label: 'Upgrade to Pro',
      variant: 'default',
      isCurrentPlan: false,
    });
  });

  it('offers a downgrade from pro to free', () => {
    expect(getCtaConfig('pro', 'free')).toEqual({
      label: 'Downgrade',
      variant: 'destructive-outline',
      isCurrentPlan: false,
    });
  });

  describe('promotion tier', () => {
    it('offers an upgrade to pro so promo users can lock in paid access', () => {
      expect(getCtaConfig('promotion', 'pro')).toEqual({
        label: 'Upgrade to Pro',
        variant: 'default',
        isCurrentPlan: false,
      });
    });

    it('renders the free card as a non-actionable fallback (no "downgrade")', () => {
      const cta = getCtaConfig('promotion', 'free');

      expect(cta.disabled).toBe(true);
      expect(cta.isCurrentPlan).toBe(false);
      // Not the destructive "Downgrade" CTA — promotion users have no Stripe
      // customer, so the billing-portal downgrade flow doesn't apply to them.
      expect(cta.variant).not.toBe('destructive-outline');
    });
  });
});
