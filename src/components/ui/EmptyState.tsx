'use client';

import { AlertTriangle, Inbox, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * EmptyState Component - Reusable empty state for lists and data views
 *
 * @example Default empty state
 * <EmptyState
 *   title="No items yet"
 *   description="Get started by creating your first item"
 *   action={{ label: "Create Item", onClick: () => router.push('/create') }}
 * />
 *
 * @example Search no results
 * <EmptyState
 *   variant="search"
 *   title="No results found"
 *   description="Try adjusting your search criteria"
 * />
 *
 * @example Error state
 * <EmptyState
 *   variant="error"
 *   title="Failed to load data"
 *   description="Something went wrong. Please try again."
 *   action={{ label: "Retry", onClick: handleRetry }}
 * />
 *
 * @example Custom icon
 * <EmptyState
 *   icon={<User className="size-16 text-muted-foreground" />}
 *   title="No users yet"
 *   description="Invite your first user to get started"
 * />
 *
 * Translation Pattern:
 * The component accepts title and description as props, making it i18n-ready.
 * Parent components should use useTranslations to pass translated strings.
 *
 * @example With translations
 * const t = useTranslations('EmptyState')
 * <EmptyState
 *   title={t('noItemsTitle')}
 *   description={t('noItemsDescription')}
 *   action={{
 *     label: t('actionCreate'),
 *     onClick: handleCreate
 *   }}
 * />
 */

type EmptyStateProps = {
  /** Custom icon to display. Overrides the default variant icon. */
  icon?: React.ReactNode;
  /** Title text for the empty state. Should be concise and clear. */
  title: string;
  /** Optional description text. Provides additional context or guidance. */
  description?: string;
  /** Optional action button with label and click handler. */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Visual variant that determines the default icon and styling. */
  variant?: 'default' | 'search' | 'error';
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
}: EmptyStateProps) {
  // Determine default icon based on variant
  const defaultIcon = {
    default: <Inbox className="size-16 text-muted-foreground" />,
    search: <Search className="size-16 text-muted-foreground" />,
    error: <AlertTriangle className="size-16 text-destructive" />,
  }[variant];

  // Use custom icon if provided, otherwise use default variant icon
  const displayIcon = icon || defaultIcon;

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center md:p-8">
      <div className="mb-4">{displayIcon}</div>
      <h3 className="mb-2 text-xl font-semibold md:text-2xl">{title}</h3>
      {description && (
        <p className="mb-6 max-w-md text-sm text-muted-foreground md:text-base">
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          className="w-full md:w-auto"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
