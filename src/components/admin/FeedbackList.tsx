'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import type { FeedbackEntry } from '@/libs/queries/feedback';

import { FeedbackCard } from './FeedbackCard';

type FeedbackListProps = {
  feedbackItems: FeedbackEntry[];
};

/**
 * FeedbackList Component
 * Renders a list of FeedbackCard components with bulk selection and actions.
 */
export function FeedbackList({ feedbackItems }: FeedbackListProps) {
  const t = useTranslations('Admin.Feedback');
  const { toast } = useToast();
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkActioning, setIsBulkActioning] = useState(false);

  const handleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === feedbackItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(feedbackItems.map(item => item.id));
    }
  };

  const handleBulkMarkReviewed = async () => {
    setIsBulkActioning(true);
    try {
      const response = await fetch('/api/admin/feedback/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-reviewed', ids: selectedIds }),
      });
      if (!response.ok) {
        throw new Error('Failed');
      }
      toast({ title: t('bulkActions.bulkMarkReviewedSuccess', { count: selectedIds.length }) });
      setSelectedIds([]);
      router.refresh();
    } catch {
      toast({ title: t('bulkActions.bulkActionError'), variant: 'destructive' });
    } finally {
      setIsBulkActioning(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkActioning(true);
    try {
      const response = await fetch('/api/admin/feedback/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids: selectedIds }),
      });
      if (!response.ok) {
        throw new Error('Failed');
      }
      toast({ title: t('bulkActions.bulkDeleteSuccess', { count: selectedIds.length }) });
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      router.refresh();
    } catch {
      toast({ title: t('bulkActions.bulkActionError'), variant: 'destructive' });
    } finally {
      setIsBulkActioning(false);
    }
  };

  if (feedbackItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="feedback-empty">
        <p className="text-lg font-medium text-muted-foreground">
          {t('noFeedback')}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('noFeedbackDescription')}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Select All + Bulk Actions Toolbar */}
      <div className="mb-3 flex items-center gap-3" data-testid="bulk-toolbar">
        <Checkbox
          checked={selectedIds.length === feedbackItems.length && feedbackItems.length > 0}
          onCheckedChange={handleSelectAll}
          data-testid="select-all-checkbox"
        />
        <span className="text-sm text-muted-foreground">
          {t('bulkActions.selectAll')}
        </span>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2" data-testid="bulk-actions">
            <span className="text-sm font-medium">
              {t('bulkActions.selected', { count: selectedIds.length })}
            </span>
            <Button
              size="sm"
              onClick={handleBulkMarkReviewed}
              disabled={isBulkActioning}
              data-testid="bulk-mark-reviewed-btn"
            >
              {t('bulkActions.markReviewed')}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={isBulkActioning}
              data-testid="bulk-delete-btn"
            >
              {t('bulkActions.delete')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds([])}
              data-testid="clear-selection-btn"
            >
              {t('bulkActions.clearSelection')}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3" data-testid="feedback-list">
        {feedbackItems.map(item => (
          <FeedbackCard
            key={item.id}
            feedback={item}
            onSelect={handleSelect}
            isSelected={selectedIds.includes(item.id)}
          />
        ))}
      </div>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent data-testid="bulk-delete-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('bulkActions.bulkDeleteConfirmTitle', { count: selectedIds.length })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('bulkActions.bulkDeleteConfirmMessage', { count: selectedIds.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isBulkActioning}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-bulk-delete-btn"
            >
              {t('bulkActions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
