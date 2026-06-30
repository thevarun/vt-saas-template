'use client';

import { useAdminAnalytics } from '@/libs/hooks/use-admin-analytics';

import { AnalyticsMetricCard } from './AnalyticsMetricCard';
import { AnalyticsSkeleton } from './AnalyticsSkeleton';
import { CompletionRatesCard } from './CompletionRatesCard';
import { SignupsChart } from './SignupsChart';

export function AnalyticsDashboard() {
  const { data: metrics, isPending, isError } = useAdminAnalytics();

  if (isPending) {
    return <AnalyticsSkeleton />;
  }

  if (isError || !metrics) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600 dark:text-red-400">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <AnalyticsMetricCard
          label="Total Users"
          value={metrics.totalUsers.value}
          trend={metrics.totalUsers.trend}
        />
        <AnalyticsMetricCard
          label="Signups (7d)"
          value={metrics.signups7d.value}
          trend={metrics.signups7d.trend}
        />
        <AnalyticsMetricCard
          label="Signups (30d)"
          value={metrics.signups30d.value}
          trend={metrics.signups30d.trend}
        />
        <AnalyticsMetricCard
          label="Active Users (7d)"
          value={metrics.activeUsers7d.value}
          trend={metrics.activeUsers7d.trend}
        />
        <AnalyticsMetricCard
          label="Activation Rate"
          value={`${metrics.activationRate.value}%`}
          trend={metrics.activationRate.trend}
        />
      </div>

      {/* Chart + Rates Section */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SignupsChart data={metrics.signupsChart} />
        <CompletionRatesCard
          onboardingCompletion={metrics.onboardingCompletion.value}
          activationRate={metrics.activationRate.value}
          feedbackCount={metrics.feedbackCount.value}
        />
      </div>
    </div>
  );
}
