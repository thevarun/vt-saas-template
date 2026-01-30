'use client';

import { formatDistanceToNow } from 'date-fns';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export type AuditLogEntryProps = {
  id: string;
  adminId: string;
  adminEmail?: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date | string;
};

type AuditLogTableProps = {
  logs: AuditLogEntryProps[];
};

const actionVariantMap: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = {
  suspend_user: 'destructive',
  unsuspend_user: 'secondary',
  delete_user: 'destructive',
  reset_password: 'default',
};

/**
 * AuditLogTable Component
 * Displays admin audit log entries in a read-only table.
 * No edit/delete buttons - audit logs are immutable.
 */
export function AuditLogTable({ logs }: AuditLogTableProps) {
  const t = useTranslations('Admin.AuditLog');

  if (logs.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground" data-testid="audit-log-empty">
        {t('noLogs')}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('columns.action')}</TableHead>
          <TableHead>{t('columns.admin')}</TableHead>
          <TableHead>{t('columns.target')}</TableHead>
          <TableHead>{t('columns.timestamp')}</TableHead>
          <TableHead>{t('columns.details')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map(log => (
          <TableRow key={log.id} data-testid="audit-log-row">
            <TableCell>
              <Badge variant={actionVariantMap[log.action] || 'outline'}>
                {t(`actions.${log.action}`)}
              </Badge>
            </TableCell>
            <TableCell className="text-sm">
              {log.adminEmail || log.adminId}
            </TableCell>
            <TableCell>
              <code className="text-xs" title={log.targetId}>
                {log.targetId.slice(0, 8)}
                ...
              </code>
            </TableCell>
            <TableCell>
              <span
                className="text-sm"
                title={new Date(log.createdAt).toLocaleString()}
              >
                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
              </span>
            </TableCell>
            <TableCell>
              {(log.metadata as Record<string, unknown> | null)?.reason
                ? (
                    <span className="text-sm">{String((log.metadata as Record<string, unknown>).reason)}</span>
                  )
                : (
                    <span className="text-muted-foreground">--</span>
                  )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
