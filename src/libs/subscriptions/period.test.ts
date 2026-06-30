import { describe, expect, it } from 'vitest';

import { getCurrentPeriod, PERIOD_MS, toDateString } from './period';

describe('getCurrentPeriod (rolling period)', () => {
  it('returns [anchor, anchor+PERIOD) when called at the anchor instant', () => {
    const anchor = new Date('2026-04-30T12:00:00Z');
    const period = getCurrentPeriod(anchor, anchor);

    expect(period.start.toISOString()).toBe(anchor.toISOString());
    expect(period.end.getTime() - period.start.getTime()).toBe(PERIOD_MS);
  });

  it('keeps the same period when called mid-window (3 days in)', () => {
    const anchor = new Date('2026-04-30T12:00:00Z');
    const now = new Date(anchor.getTime() + 3 * 24 * 60 * 60 * 1000);
    const period = getCurrentPeriod(anchor, now);

    expect(period.start.toISOString()).toBe(anchor.toISOString());
    expect(period.end.toISOString()).toBe(new Date(anchor.getTime() + PERIOD_MS).toISOString());
  });

  it('returns the next window once the previous one has elapsed', () => {
    const anchor = new Date('2026-04-30T12:00:00Z');
    const now = new Date(anchor.getTime() + PERIOD_MS + 60_000); // 1 period + 1 minute later
    const period = getCurrentPeriod(anchor, now);

    expect(period.start.getTime()).toBe(anchor.getTime() + PERIOD_MS);
    expect(period.end.getTime()).toBe(anchor.getTime() + 2 * PERIOD_MS);
  });

  it('returns the Nth window after N periods', () => {
    const anchor = new Date('2026-01-01T00:00:00Z');
    const now = new Date(anchor.getTime() + 5 * PERIOD_MS + 60_000);
    const period = getCurrentPeriod(anchor, now);

    expect(period.start.getTime()).toBe(anchor.getTime() + 5 * PERIOD_MS);
    expect(period.end.getTime()).toBe(anchor.getTime() + 6 * PERIOD_MS);
  });

  it('end is exactly one period after start', () => {
    const anchor = new Date('2026-06-15T08:30:00Z');
    const now = new Date(anchor.getTime() + 10 * 24 * 60 * 60 * 1000);
    const period = getCurrentPeriod(anchor, now);

    expect(period.end.getTime() - period.start.getTime()).toBe(PERIOD_MS);
  });

  it('floors negative elapsed time to the anchor (clock skew defense)', () => {
    const anchor = new Date('2026-05-01T00:00:00Z');
    const now = new Date(anchor.getTime() - 1000); // before anchor
    const period = getCurrentPeriod(anchor, now);

    expect(period.start.toISOString()).toBe(anchor.toISOString());
  });

  it('a fresh anchor mid-window resets the period (tier-transition scenario)', () => {
    const originalAnchor = new Date('2026-01-01T00:00:00Z');
    const now = new Date('2026-01-04T12:00:00Z'); // 3.5 days into period 0

    const before = getCurrentPeriod(originalAnchor, now);

    expect(before.start.toISOString()).toBe(originalAnchor.toISOString());

    // Tier transition resets the anchor to NOW; new period starts now.
    const resetAnchor = now;
    const after = getCurrentPeriod(resetAnchor, now);

    expect(after.start.toISOString()).toBe(now.toISOString());
    expect(after.end.getTime() - after.start.getTime()).toBe(PERIOD_MS);
  });
});

describe('toDateString', () => {
  it('formats date as YYYY-MM-DD', () => {
    const date = new Date(Date.UTC(2026, 1, 15));

    expect(toDateString(date)).toBe('2026-02-15');
  });

  it('pads single-digit months and days', () => {
    const date = new Date(Date.UTC(2026, 0, 5));

    expect(toDateString(date)).toBe('2026-01-05');
  });

  it('handles December 31', () => {
    const date = new Date(Date.UTC(2026, 11, 31));

    expect(toDateString(date)).toBe('2026-12-31');
  });
});
