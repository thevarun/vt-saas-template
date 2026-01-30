'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ACTION_OPTIONS = [
  'suspend_user',
  'unsuspend_user',
  'delete_user',
  'reset_password',
] as const;

/**
 * AuditLogFilters Component
 * URL-based filtering for the audit log table.
 * Filters are persisted in URL search params for shareability.
 */
export function AuditLogFilters() {
  const t = useTranslations('Admin.AuditLog');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [action, setAction] = useState(searchParams.get('action') || '');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');

  const isDateRangeInvalid = !!(startDate && endDate && startDate > endDate);

  // Count active filters
  const activeFilterCount = [action, startDate, endDate].filter(Boolean).length;

  const applyFilters = useCallback(() => {
    // Validate date range: startDate must not be after endDate
    if (startDate && endDate && startDate > endDate) {
      return;
    }

    const params = new URLSearchParams();
    if (action) {
      params.set('action', action);
    }
    if (startDate) {
      params.set('startDate', startDate);
    }
    if (endDate) {
      params.set('endDate', endDate);
    }
    // Reset to page 1 when applying filters
    router.push(`${pathname}?${params.toString()}`);
  }, [action, startDate, endDate, router, pathname]);

  const clearFilters = useCallback(() => {
    setAction('');
    setStartDate('');
    setEndDate('');
    router.push(pathname);
  }, [router, pathname]);

  return (
    <div className="flex flex-wrap items-end gap-4" data-testid="audit-log-filters">
      {/* Action filter */}
      <div className="w-48">
        <label className="mb-1 block text-sm font-medium">{t('filters.action')}</label>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger data-testid="action-filter">
            <SelectValue placeholder={t('filters.allActions')} />
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map(opt => (
              <SelectItem key={opt} value={opt}>
                {t(`actions.${opt}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date range */}
      <div>
        <label className="mb-1 block text-sm font-medium">{t('filters.startDate')}</label>
        <Input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          data-testid="start-date-filter"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">{t('filters.endDate')}</label>
        <Input
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          data-testid="end-date-filter"
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button onClick={applyFilters} disabled={isDateRangeInvalid} data-testid="apply-filters">
          {t('filters.apply')}
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2" data-testid="active-filter-count">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button variant="outline" onClick={clearFilters} data-testid="clear-filters">
            {t('filters.clear')}
          </Button>
        )}
      </div>

      {/* Date range validation error */}
      {isDateRangeInvalid && (
        <p className="w-full text-sm text-red-500" data-testid="date-range-error">
          {t('filters.invalidDateRange')}
        </p>
      )}
    </div>
  );
}
