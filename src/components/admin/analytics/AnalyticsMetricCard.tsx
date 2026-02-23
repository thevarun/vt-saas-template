import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { TrendData } from '@/libs/utils/calculateTrend';
import { formatTrendValue } from '@/libs/utils/calculateTrend';

type AnalyticsMetricCardProps = {
  label: string;
  value: string | number;
  trend?: TrendData;
};

export function AnalyticsMetricCard({ label, value, trend }: AnalyticsMetricCardProps) {
  const getTrendIcon = () => {
    if (!trend) {
      return null;
    }

    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="size-3" />;
      case 'down':
        return <TrendingDown className="size-3" />;
      case 'neutral':
        return <Minus className="size-3" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    if (!trend) {
      return '';
    }

    switch (trend.direction) {
      case 'up':
        return 'text-green-600 dark:text-green-500';
      case 'down':
        return 'text-red-600 dark:text-red-500';
      case 'neutral':
        return 'text-muted-foreground';
      default:
        return '';
    }
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="p-6">
        <CardDescription className="text-sm text-muted-foreground">
          {label}
        </CardDescription>
        <CardTitle className="text-3xl font-bold">
          {value}
        </CardTitle>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{formatTrendValue(trend)}</span>
          </div>
        )}
      </CardHeader>
    </Card>
  );
}
