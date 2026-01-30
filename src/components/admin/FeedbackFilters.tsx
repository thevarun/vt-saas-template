'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TYPE_OPTIONS = ['bug', 'feature', 'praise'] as const;
const STATUS_OPTIONS = ['pending', 'reviewed', 'archived'] as const;

/**
 * FeedbackFilters Component
 * URL-based filtering for the feedback list.
 * Uses Tabs for type filter and Select for status filter.
 */
export function FeedbackFilters() {
  const t = useTranslations('Admin.Feedback');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentType = searchParams.get('type') || '';
  const currentStatus = searchParams.get('status') || '';

  // Count active filters
  const activeFilterCount = [currentType, currentStatus].filter(Boolean).length;

  const updateFilters = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 when applying filters
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  return (
    <div className="flex flex-wrap items-end gap-4" data-testid="feedback-filters">
      {/* Type filter using Tabs */}
      <div>
        <label className="mb-1 block text-sm font-medium">{t('filters.type')}</label>
        <Tabs
          value={currentType || 'all'}
          onValueChange={value => updateFilters('type', value === 'all' ? '' : value)}
        >
          <TabsList data-testid="type-filter">
            <TabsTrigger value="all">{t('filters.allTypes')}</TabsTrigger>
            {TYPE_OPTIONS.map(opt => (
              <TabsTrigger key={opt} value={opt}>
                {t(`types.${opt}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Status filter using Select */}
      <div className="w-48">
        <label className="mb-1 block text-sm font-medium">{t('filters.status')}</label>
        <Select
          value={currentStatus || 'all'}
          onValueChange={value => updateFilters('status', value === 'all' ? '' : value)}
        >
          <SelectTrigger data-testid="status-filter">
            <SelectValue placeholder={t('filters.allStatuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt} value={opt}>
                {t(`statuses.${opt}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active filter count and clear */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" data-testid="active-filter-count">
            {t('filters.activeFilters', { count: activeFilterCount })}
          </Badge>
          <Button variant="outline" size="sm" onClick={clearFilters} data-testid="clear-filters">
            {t('filters.clearFilters')}
          </Button>
        </div>
      )}
    </div>
  );
}
