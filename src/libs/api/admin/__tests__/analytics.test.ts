import { describe, expect, it } from 'vitest';

import { calculateTrend } from '@/libs/utils/calculateTrend';

describe('calculateTrend', () => {
  it('calculates positive trend correctly', () => {
    const trend = calculateTrend(120, 100);

    expect(trend.direction).toBe('up');
    expect(trend.percentage).toBe(20);
    expect(trend.isPositive).toBe(true);
  });

  it('calculates negative trend correctly', () => {
    const trend = calculateTrend(80, 100);

    expect(trend.direction).toBe('down');
    expect(trend.percentage).toBe(20);
    expect(trend.isPositive).toBe(false);
  });

  it('handles zero change (neutral)', () => {
    const trend = calculateTrend(100, 100);

    expect(trend.direction).toBe('neutral');
    expect(trend.percentage).toBe(0);
    expect(trend.isPositive).toBe(false);
  });

  it('handles division by zero when previous is 0', () => {
    const trend = calculateTrend(50, 0);

    expect(trend.direction).toBe('up');
    expect(trend.percentage).toBe(100);
    expect(trend.isPositive).toBe(true);
  });

  it('handles both current and previous being 0', () => {
    const trend = calculateTrend(0, 0);

    expect(trend.direction).toBe('neutral');
    expect(trend.percentage).toBe(0);
    expect(trend.isPositive).toBe(false);
  });

  it('rounds percentages correctly', () => {
    const trend = calculateTrend(105, 100);

    expect(trend.percentage).toBe(5);
    expect(trend.isPositive).toBe(true);
  });

  it('rounds decimal percentages to 1 decimal place', () => {
    const trend = calculateTrend(115, 100);

    expect(trend.percentage).toBe(15);
    expect(trend.isPositive).toBe(true);
  });
});
