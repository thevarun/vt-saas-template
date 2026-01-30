import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { TrendData } from '@/libs/utils/calculateTrend';

export type MetricCardProps = {
  title: string;
  value: number | null;
  trend?: TrendData;
  icon?: LucideIcon;
  loading?: boolean;
  href?: string;
};

export function MetricCard({
  title,
  value,
  trend,
  icon: Icon,
  loading = false,
  href,
}: MetricCardProps) {
  const content = (
    <Card className={href ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardDescription>{title}</CardDescription>
          {Icon && <Icon className="size-4 text-muted-foreground" />}
        </div>

        {loading
          ? (
              <Skeleton className="h-9 w-20" />
            )
          : (
              <CardTitle className="text-3xl font-bold">
                {value ?? '--'}
              </CardTitle>
            )}

        {trend && !loading && trend.direction !== 'neutral' && (
          <div
            className={`flex items-center gap-1 text-xs ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
            data-testid="trend-indicator"
          >
            {trend.direction === 'up'
              ? (
                  <TrendingUp className="size-3" />
                )
              : (
                  <TrendingDown className="size-3" />
                )}
            <span>
              {trend.percentage}
              %
            </span>
          </div>
        )}
      </CardHeader>
    </Card>
  );

  if (href) {
    return <Link href={href} aria-label={title}>{content}</Link>;
  }

  return content;
}
