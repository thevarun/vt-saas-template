import { describe, expect, it } from 'vitest';

import { pickBanner, thresholdForDays } from './expiry-banner-logic';

const now = new Date('2026-05-05T12:00:00Z');

function isoIn(daysFromNow: number): string {
  return new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000).toISOString();
}

describe('pickBanner', () => {
  it('returns trial banner when trial expires within 7 days', () => {
    const banner = pickBanner({
      status: 'trial',
      tierName: 'pro',
      trialExpiresAt: isoIn(3),
      expiresAt: null,
      now,
    });

    expect(banner).toEqual({
      variant: 'trial',
      daysLeft: 3,
      endDate: isoIn(3),
    });
  });

  it('returns null when trial expiry is more than 7 days out', () => {
    const banner = pickBanner({
      status: 'trial',
      tierName: 'pro',
      trialExpiresAt: isoIn(10),
      expiresAt: null,
      now,
    });

    expect(banner).toBeNull();
  });

  it('clamps daysLeft to 0 when trial is already past expiry', () => {
    const banner = pickBanner({
      status: 'trial',
      tierName: 'pro',
      trialExpiresAt: isoIn(-1),
      expiresAt: null,
      now,
    });

    expect(banner?.daysLeft).toBe(0);
  });

  it('returns promotion banner when promotion expires within 7 days', () => {
    const banner = pickBanner({
      status: 'active',
      tierName: 'promotion',
      trialExpiresAt: null,
      expiresAt: isoIn(5),
      now,
    });

    expect(banner).toEqual({
      variant: 'promotion',
      daysLeft: 5,
      endDate: isoIn(5),
    });
  });

  it('returns null when promotion expiry is more than 7 days out', () => {
    const banner = pickBanner({
      status: 'active',
      tierName: 'promotion',
      trialExpiresAt: null,
      expiresAt: isoIn(20),
      now,
    });

    expect(banner).toBeNull();
  });

  it('returns cancelled-paid banner for active pro with expires_at set (any horizon)', () => {
    // cancel_at_period_end populates expires_at; we want the banner visible the
    // entire wind-down window, not just within 7 days.
    const banner = pickBanner({
      status: 'active',
      tierName: 'pro',
      trialExpiresAt: null,
      expiresAt: isoIn(20),
      now,
    });

    expect(banner).toEqual({
      variant: 'cancelled-paid',
      daysLeft: 20,
      endDate: isoIn(20),
    });
  });

  it('returns null for active pro without expires_at (no cancellation pending)', () => {
    const banner = pickBanner({
      status: 'active',
      tierName: 'pro',
      trialExpiresAt: null,
      expiresAt: null,
      now,
    });

    expect(banner).toBeNull();
  });

  it('returns null for active free user', () => {
    const banner = pickBanner({
      status: 'active',
      tierName: 'free',
      trialExpiresAt: null,
      expiresAt: null,
      now,
    });

    expect(banner).toBeNull();
  });

  it('returns null for expired-trial free user (status flipped, banner gone)', () => {
    const banner = pickBanner({
      status: 'expired',
      tierName: 'free',
      trialExpiresAt: isoIn(-1),
      expiresAt: null,
      now,
    });

    expect(banner).toBeNull();
  });

  it('prefers trial banner over promotion when both could apply (trial wins)', () => {
    const banner = pickBanner({
      status: 'trial',
      tierName: 'promotion', // shouldn't happen in practice
      trialExpiresAt: isoIn(2),
      expiresAt: isoIn(5),
      now,
    });

    expect(banner?.variant).toBe('trial');
  });
});

describe('thresholdForDays', () => {
  // Iterates [7, 3, 1] and returns the first bucket days-left fits under — i.e.
  // the widest matching threshold (the dismissal key is keyed on this).
  it('maps days-left to the widest matching threshold bucket', () => {
    expect(thresholdForDays(1)).toBe(7);
    expect(thresholdForDays(3)).toBe(7);
    expect(thresholdForDays(5)).toBe(7);
    expect(thresholdForDays(7)).toBe(7);
  });

  it('returns null when days-left exceeds every threshold', () => {
    expect(thresholdForDays(8)).toBeNull();
  });
});
