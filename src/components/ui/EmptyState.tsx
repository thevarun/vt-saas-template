'use client';

import { AlertTriangle, Inbox, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/Helpers';

/**
 * EmptyState Component - Reusable empty state for lists and data views
 * Adapted from MagicPatterns design with dashed border container and circular icon.
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
 *   icon={<User className="size-10" />}
 *   title="No users yet"
 *   description="Invite your first user to get started"
 * />
 *
 * @example No border variant (for embedding in cards)
 * <EmptyState
 *   title="No projects"
 *   description="Create your first project"
 *   className="border-none bg-transparent"
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

export type EmptyStateProps = {
  /** Custom icon to display. Overrides the default variant icon. Should be an SVG icon. */
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
  /** Additional CSS classes for the container. */
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className,
}: EmptyStateProps) {
  // Default icons for each variant
  const defaultIcons = {
    default: <Inbox />,
    search: <Search />,
    error: <AlertTriangle />,
  };

  // Variant-specific styling for the icon container
  const iconContainerStyles = {
    default: 'bg-muted text-muted-foreground',
    search: 'bg-secondary text-secondary-foreground',
    error: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500',
  };

  // Use custom icon if provided, otherwise use default variant icon
  const displayIcon = icon || defaultIcons[variant];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center md:p-12',
        className,
      )}
    >
      {/* Circular icon container */}
      <div
        className={cn(
          'mb-6 flex size-20 items-center justify-center rounded-full',
          iconContainerStyles[variant],
        )}
      >
        {/* Icon wrapper to enforce consistent sizing */}
        <div className="size-10 [&>svg]:size-full">{displayIcon}</div>
      </div>

      <h3 className="mb-2 text-xl font-semibold tracking-tight">{title}</h3>

      {description && (
        <p className="mb-8 max-w-sm text-sm leading-relaxed text-muted-foreground md:text-base">
          {description}
        </p>
      )}

      {action && (
        <Button
          onClick={action.onClick}
          variant={variant === 'search' ? 'secondary' : 'default'}
          className="w-full min-w-[140px] sm:w-auto"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
