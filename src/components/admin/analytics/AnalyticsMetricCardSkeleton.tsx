import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AnalyticsMetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="p-6">
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="mb-2 h-8 w-16" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
    </Card>
  );
}
