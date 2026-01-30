'use client';

import { formatDistanceToNow } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { STATUS_BADGE_STYLES, TYPE_BADGE_STYLES } from '@/libs/constants/feedbackBadges';
import type { FeedbackEntry } from '@/libs/queries/feedback';

import { FeedbackDetailDialog } from './FeedbackDetailDialog';

export type FeedbackCardProps = {
  feedback: FeedbackEntry;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
};

/**
 * FeedbackCard Component
 * Displays a single feedback entry as a card with type/status badges,
 * message preview, email, and timestamp. Supports optional selection.
 */
export function FeedbackCard({ feedback: item, onSelect, isSelected }: FeedbackCardProps) {
  const t = useTranslations('Admin.Feedback');
  const [dialogOpen, setDialogOpen] = useState(false);

  const messagePreview = item.message.length > 100
    ? `${item.message.slice(0, 100)}...`
    : item.message;

  return (
    <>
      <div className="flex items-start gap-3">
        {onSelect && (
          <div className="flex pt-4">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(item.id)}
              onClick={e => e.stopPropagation()}
              data-testid="feedback-checkbox"
            />
          </div>
        )}
        <button
          type="button"
          className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
          onClick={() => setDialogOpen(true)}
          data-testid="feedback-card"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={TYPE_BADGE_STYLES[item.type].variant} className={TYPE_BADGE_STYLES[item.type].className} data-testid="feedback-type-badge">
                {t(`types.${item.type}`)}
              </Badge>
              <Badge variant={STATUS_BADGE_STYLES[item.status].variant} className={STATUS_BADGE_STYLES[item.status].className} data-testid="feedback-status-badge">
                {t(`statuses.${item.status}`)}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground" data-testid="feedback-timestamp">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="mt-2 text-sm" data-testid="feedback-message">
            {messagePreview}
          </p>
          <p className="mt-1 text-xs text-muted-foreground" data-testid="feedback-email">
            {item.email || t('anonymous')}
          </p>
        </button>
      </div>

      <FeedbackDetailDialog
        feedback={item}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
