import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { AnalyticsDashboard } from '@/components/admin/analytics/AnalyticsDashboard';
import { AnalyticsSkeleton } from '@/components/admin/analytics/AnalyticsSkeleton';

type AnalyticsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Admin.Analytics' });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Dashboard with Suspense */}
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsDashboard />
      </Suspense>
    </div>
  );
}
