import { getTranslations } from 'next-intl/server';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Admin Dashboard Page
 * Overview page for the admin panel showing key metrics
 *
 * Note: Actual metrics will be implemented in Story 6.5
 * This is a placeholder with the layout structure.
 */
export default async function AdminDashboardPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Admin' });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h2>
        <p className="text-muted-foreground">{t('dashboard.description')}</p>
      </div>

      {/* Metrics cards grid - placeholders for Story 6.5 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>{t('dashboard.totalUsers')}</CardDescription>
            <CardTitle className="text-3xl font-bold">--</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>{t('dashboard.newSignups')}</CardDescription>
            <CardTitle className="text-3xl font-bold">--</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>{t('dashboard.activeUsers')}</CardDescription>
            <CardTitle className="text-3xl font-bold">--</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>{t('dashboard.pendingFeedback')}</CardDescription>
            <CardTitle className="text-3xl font-bold">--</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
