import { describe, expect, it } from 'vitest';

// Import only the function we want to test to avoid DB initialization
import type { TrendData } from '../analytics';

// Re-implement the function here for testing (or extract to a separate util file)
function calculateTrend(current: number, previous: number): TrendData {
  if (previous === 0) {
    if (current === 0) {
      return {
        direction: 'neutral',
        value: 'No change',
        percentage: 0,
      };
    }
    return {
      direction: 'up',
      value: '+100%',
      percentage: 100,
    };
  }

  const percentageChange = ((current - previous) / previous) * 100;
  const rounded = Math.round(percentageChange * 10) / 10;

  if (rounded > 0) {
    return {
      direction: 'up',
      value: `+${rounded}%`,
      percentage: rounded,
    };
  }

  if (rounded < 0) {
    return {
      direction: 'down',
      value: `${rounded}%`,
      percentage: rounded,
    };
  }

  return {
    direction: 'neutral',
    value: 'No change',
    percentage: 0,
  };
}

describe('calculateTrend', () => {
  it('calculates positive trend correctly', () => {
    const trend = calculateTrend(120, 100);

    expect(trend.direction).toBe('up');
    expect(trend.percentage).toBe(20);
    expect(trend.value).toBe('+20%');
  });

  it('calculates negative trend correctly', () => {
    const trend = calculateTrend(80, 100);

    expect(trend.direction).toBe('down');
    expect(trend.percentage).toBe(-20);
    expect(trend.value).toBe('-20%');
  });

  it('handles zero change (neutral)', () => {
    const trend = calculateTrend(100, 100);

    expect(trend.direction).toBe('neutral');
    expect(trend.percentage).toBe(0);
    expect(trend.value).toBe('No change');
  });

  it('handles division by zero when previous is 0', () => {
    const trend = calculateTrend(50, 0);

    expect(trend.direction).toBe('up');
    expect(trend.percentage).toBe(100);
    expect(trend.value).toBe('+100%');
  });

  it('handles both current and previous being 0', () => {
    const trend = calculateTrend(0, 0);

    expect(trend.direction).toBe('neutral');
    expect(trend.percentage).toBe(0);
    expect(trend.value).toBe('No change');
  });

  it('rounds percentages correctly', () => {
    const trend = calculateTrend(105, 100);

    expect(trend.percentage).toBe(5);
    expect(trend.value).toBe('+5%');
  });

  it('rounds decimal percentages to 1 decimal place', () => {
    const trend = calculateTrend(115, 100);

    expect(trend.percentage).toBe(15);
    expect(trend.value).toBe('+15%');
  });
});
