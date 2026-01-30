export type TrendData = {
  percentage: number;
  direction: 'up' | 'down' | 'neutral';
  isPositive: boolean;
};

/**
 * Calculates the percentage change between current and previous period values.
 * Returns trend direction and percentage for display in metric cards.
 */
export function calculateTrend(current: number, previous: number): TrendData {
  // When previous period had 0, we report 100% increase if current > 0.
  // This is a convention since the actual percentage change is undefined (division by zero).
  if (previous === 0) {
    return {
      percentage: current > 0 ? 100 : 0,
      direction: current > 0 ? 'up' : 'neutral',
      isPositive: current > 0,
    };
  }

  const change = current - previous;
  const percentage = (change / previous) * 100;
  const direction: TrendData['direction'] = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';

  return {
    percentage: Math.abs(Number.parseFloat(percentage.toFixed(1))),
    direction,
    isPositive: change > 0,
  };
}
