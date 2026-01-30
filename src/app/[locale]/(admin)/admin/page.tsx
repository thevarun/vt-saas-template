import { Activity, MessageSquare, UserPlus, Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { MetricCard } from '@/components/admin/MetricCard';
import type { MetricWithTrend } from '@/libs/queries/metrics';
import {
  getActiveUsersCountWithTrend,
  getNewSignupsCountWithTrend,
  getPendingFeedbackCount,
  getTotalUsersCount,
} from '@/libs/queries/metrics';

/**
 * Admin Dashboard Page
 * Overview page for the admin panel showing key system metrics.
 * All metrics are fetched server-side for performance and security.
 */
export default async function AdminDashboardPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Admin' });

  let totalUsers: number | null = null;
  let newSignups: MetricWithTrend | null = null;
  let activeUsers: MetricWithTrend | null = null;
  let pendingFeedback: number | null = null;

  try {
    ;[totalUsers, newSignups, activeUsers, pendingFeedback] = await Promise.all([
      getTotalUsersCount(),
      getNewSignupsCountWithTrend(),
      getActiveUsersCountWithTrend(),
      getPendingFeedbackCount(),
    ]);
  } catch (error) {
    console.error('Failed to fetch dashboard metrics:', error);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h2>
        <p className="text-muted-foreground">{t('dashboard.description')}</p>
      </div>

      {/* Metrics cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title={t('dashboard.totalUsers')}
          value={totalUsers}
          icon={Users}
        />

        <MetricCard
          title={t('dashboard.newSignups')}
          value={newSignups?.count ?? null}
          trend={newSignups?.trend}
          icon={UserPlus}
        />

        <MetricCard
          title={t('dashboard.activeUsers')}
          value={activeUsers?.count ?? null}
          trend={activeUsers?.trend}
          icon={Activity}
        />

        <MetricCard
          title={t('dashboard.pendingFeedback')}
          value={pendingFeedback}
          icon={MessageSquare}
          href="/admin/feedback"
        />
      </div>
    </div>
  );
}
