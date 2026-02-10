'use client';

import { useEffect, useState } from 'react';

import type { AnalyticsMetrics } from '@/libs/api/admin/analytics';

import { AnalyticsMetricCard } from './AnalyticsMetricCard';
import { AnalyticsSkeleton } from './AnalyticsSkeleton';
import { CompletionRatesCard } from './CompletionRatesCard';
import { SignupsChart } from './SignupsChart';

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/admin/analytics');
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  if (isLoading || !metrics) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
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
