import { describe, expect, it } from 'vitest';

import { calculateTrend } from '../calculateTrend';

describe('calculateTrend', () => {
  it('returns positive trend when current > previous', () => {
    const result = calculateTrend(50, 40);

    expect(result.direction).toBe('up');
    expect(result.isPositive).toBe(true);
    expect(result.percentage).toBe(25);
  });

  it('returns negative trend when current < previous', () => {
    const result = calculateTrend(30, 40);

    expect(result.direction).toBe('down');
    expect(result.isPositive).toBe(false);
    expect(result.percentage).toBe(25);
  });

  it('returns neutral when current equals previous', () => {
    const result = calculateTrend(40, 40);

    expect(result.direction).toBe('neutral');
    expect(result.isPositive).toBe(false);
    expect(result.percentage).toBe(0);
  });

  it('handles zero previous with positive current', () => {
    const result = calculateTrend(10, 0);

    expect(result.direction).toBe('up');
    expect(result.isPositive).toBe(true);
    expect(result.percentage).toBe(100);
  });

  it('handles zero previous with zero current', () => {
    const result = calculateTrend(0, 0);

    expect(result.direction).toBe('neutral');
    expect(result.isPositive).toBe(false);
    expect(result.percentage).toBe(0);
  });

  it('rounds percentage to one decimal place', () => {
    const result = calculateTrend(33, 100);

    expect(result.percentage).toBe(67);
    expect(result.direction).toBe('down');
  });

  it('handles fractional percentages', () => {
    const result = calculateTrend(103, 100);

    expect(result.percentage).toBe(3);
    expect(result.direction).toBe('up');
    expect(result.isPositive).toBe(true);
  });

  it('returns absolute percentage value for negative trends', () => {
    const result = calculateTrend(80, 100);

    expect(result.percentage).toBe(20);
    expect(result.direction).toBe('down');
    expect(result.isPositive).toBe(false);
  });

  it('handles 100% decrease', () => {
    const result = calculateTrend(0, 50);

    expect(result.percentage).toBe(100);
    expect(result.direction).toBe('down');
    expect(result.isPositive).toBe(false);
  });
});
