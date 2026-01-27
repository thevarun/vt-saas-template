'use client';

import {
  AlertTriangle,
  FileText,
  Inbox,
  Palette,
  Search,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState } from '@/components/ui/EmptyState';
import { Separator } from '@/components/ui/separator';

/**
 * Design System Showcase Page
 * Displays all reusable UI components for design consistency verification
 */
export default function DesignSystemPage() {
  const t = useTranslations('DesignSystem');

  return (
    <div className="container mx-auto max-w-5xl p-6 md:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
            <Palette className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {t('title')}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('description')}
            </p>
          </div>
        </div>
      </div>

      {/* Empty States Section */}
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t('emptyStates.title')}
        </h2>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
          {t('emptyStates.description')}
        </p>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Default Variant */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('emptyStates.defaultVariant')}
            </h3>
            <EmptyState
              title={t('emptyStates.examples.noItems.title')}
              description={t('emptyStates.examples.noItems.description')}
              action={{
                label: t('emptyStates.examples.noItems.action'),
                onClick: () => {},
              }}
            />
          </div>

          {/* Search Variant */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('emptyStates.searchVariant')}
            </h3>
            <EmptyState
              variant="search"
              title={t('emptyStates.examples.noResults.title')}
              description={t('emptyStates.examples.noResults.description')}
              action={{
                label: t('emptyStates.examples.noResults.action'),
                onClick: () => {},
              }}
            />
          </div>

          {/* Error Variant */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('emptyStates.errorVariant')}
            </h3>
            <EmptyState
              variant="error"
              title={t('emptyStates.examples.error.title')}
              description={t('emptyStates.examples.error.description')}
              action={{
                label: t('emptyStates.examples.error.action'),
                onClick: () => {},
              }}
            />
          </div>

          {/* Custom Icon Example */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('emptyStates.customIcon')}
            </h3>
            <EmptyState
              icon={<Users className="size-16 text-muted-foreground" />}
              title={t('emptyStates.examples.noTeam.title')}
              description={t('emptyStates.examples.noTeam.description')}
              action={{
                label: t('emptyStates.examples.noTeam.action'),
                onClick: () => {},
              }}
            />
          </div>

          {/* No Action Button Example */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('emptyStates.noAction')}
            </h3>
            <EmptyState
              icon={<FileText className="size-16 text-muted-foreground" />}
              title={t('emptyStates.examples.noDocs.title')}
              description={t('emptyStates.examples.noDocs.description')}
            />
          </div>
        </div>
      </section>

      <Separator className="my-8" />

      {/* Usage Guidelines */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t('usage.title')}
        </h2>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/50">
          <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <Inbox className="mt-0.5 size-4 text-blue-600" />
              <span>{t('usage.defaultHint')}</span>
            </li>
            <li className="flex items-start gap-2">
              <Search className="mt-0.5 size-4 text-blue-600" />
              <span>{t('usage.searchHint')}</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 text-blue-600" />
              <span>{t('usage.errorHint')}</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
