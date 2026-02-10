import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { AnalyticsMetricCardSkeleton } from './AnalyticsMetricCardSkeleton';
import { SignupsChartSkeleton } from './SignupsChartSkeleton';

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <AnalyticsMetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Chart + Rates Skeleton */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SignupsChartSkeleton />
        <Card>
          <CardHeader>
            <Skeleton className="mb-4 h-6 w-36" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="mb-2 h-4 w-32" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
