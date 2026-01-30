import type { FeedbackStatus, FeedbackType } from '@/libs/queries/feedback';

type BadgeStyle = {
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
  className?: string;
};

export const TYPE_BADGE_STYLES: Record<FeedbackType, BadgeStyle> = {
  bug: { variant: 'destructive' },
  feature: { variant: 'default', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  praise: { variant: 'default', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
};

export const STATUS_BADGE_STYLES: Record<FeedbackStatus, BadgeStyle> = {
  pending: { variant: 'default' },
  reviewed: { variant: 'secondary' },
  archived: { variant: 'outline' },
};
