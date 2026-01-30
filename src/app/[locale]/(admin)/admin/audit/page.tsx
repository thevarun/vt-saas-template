import { getTranslations } from 'next-intl/server';

import { AuditLogFilters } from '@/components/admin/AuditLogFilters';
import { AuditLogPagination } from '@/components/admin/AuditLogPagination';
import { AuditLogTable } from '@/components/admin/AuditLogTable';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getAuditLogCount, getAuditLogs } from '@/libs/queries/auditLog';

/**
 * Admin Audit Log Page
 * Server component that fetches audit logs with URL-based filtering and pagination.
 */
export default async function AuditLogPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await props.params;
  const searchParams = await props.searchParams;
  const t = await getTranslations({ locale, namespace: 'Admin.AuditLog' });

  // Parse filters from URL search params
  const action = typeof searchParams.action === 'string' ? searchParams.action : undefined;
  const adminId = typeof searchParams.adminId === 'string' ? searchParams.adminId : undefined;
  const startDate = typeof searchParams.startDate === 'string' ? new Date(searchParams.startDate) : undefined;
  const endDate = typeof searchParams.endDate === 'string' ? new Date(searchParams.endDate) : undefined;
  const page = typeof searchParams.page === 'string' ? Number.parseInt(searchParams.page, 10) : 1;

  const limit = 50;
  const offset = (page - 1) * limit;

  // Fetch audit logs and count in parallel
  const [logs, totalCount] = await Promise.all([
    getAuditLogs({ action, adminId, startDate, endDate, limit, offset }),
    getAuditLogCount({ action, adminId, startDate, endDate }),
  ]);

  const totalPages = Math.ceil((totalCount || 0) / limit);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <AuditLogFilters />

      <Card>
        <CardHeader>
          <CardTitle>{t('recentActions')}</CardTitle>
          <CardDescription>
            {t('showingResults', { count: logs?.length || 0, total: totalCount })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogTable logs={logs || []} />
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <AuditLogPagination currentPage={page} totalPages={totalPages} />
      )}
    </div>
  );
}
