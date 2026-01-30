'use client';

import { format } from 'date-fns';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { STATUS_BADGE_STYLES, TYPE_BADGE_STYLES } from '@/libs/constants/feedbackBadges';
import type { FeedbackEntry } from '@/libs/queries/feedback';

type FeedbackDetailDialogProps = {
  feedback: FeedbackEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * FeedbackDetailDialog Component
 * Shows full feedback details in a dialog with action buttons.
 */
export function FeedbackDetailDialog({ feedback: item, open, onOpenChange }: FeedbackDetailDialogProps) {
  const t = useTranslations('Admin.Feedback');
  const { toast } = useToast();
  const router = useRouter();
  const [isMarkingReviewed, setIsMarkingReviewed] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleMarkReviewed = async () => {
    setIsMarkingReviewed(true);
    try {
      const response = await fetch(`/api/admin/feedback/${item.id}/mark-reviewed`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed');
      }
      toast({ title: t('actions.markReviewedSuccess') });
      onOpenChange(false);
      router.refresh();
    } catch {
      toast({ title: t('actions.actionError'), variant: 'destructive' });
    } finally {
      setIsMarkingReviewed(false);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const response = await fetch(`/api/admin/feedback/${item.id}/archive`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed');
      }
      toast({ title: t('actions.archiveSuccess') });
      onOpenChange(false);
      router.refresh();
    } catch {
      toast({ title: t('actions.actionError'), variant: 'destructive' });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/feedback/${item.id}/delete`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed');
      }
      toast({ title: t('actions.deleteSuccess') });
      setDeleteDialogOpen(false);
      onOpenChange(false);
      router.refresh();
    } catch {
      toast({ title: t('actions.actionError'), variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmText('');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg" data-testid="feedback-detail-dialog">
          <DialogHeader>
            <DialogTitle>{t('detail.title')}</DialogTitle>
            <DialogDescription>
              {item.email || t('anonymous')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Type and Status */}
            <div className="flex items-center gap-4">
              <div>
                <span className="text-xs font-medium text-muted-foreground">{t('detail.type')}</span>
                <div className="mt-1">
                  <Badge variant={TYPE_BADGE_STYLES[item.type].variant} className={TYPE_BADGE_STYLES[item.type].className}>
                    {t(`types.${item.type}`)}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">{t('detail.status')}</span>
                <div className="mt-1">
                  <Badge variant={STATUS_BADGE_STYLES[item.status].variant} className={STATUS_BADGE_STYLES[item.status].className}>
                    {t(`statuses.${item.status}`)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Full Message */}
            <div>
              <span className="text-xs font-medium text-muted-foreground">{t('detail.fullMessage')}</span>
              <p className="mt-1 whitespace-pre-wrap text-sm" data-testid="feedback-full-message">
                {item.message}
              </p>
            </div>

            {/* Submitted by */}
            <div>
              <span className="text-xs font-medium text-muted-foreground">{t('detail.submittedBy')}</span>
              <p className="mt-1 text-sm">{item.email || t('anonymous')}</p>
            </div>

            {/* Timestamps */}
            <div className="flex gap-6">
              <div>
                <span className="text-xs font-medium text-muted-foreground">{t('detail.submittedAt')}</span>
                <p className="mt-1 text-sm">
                  {format(new Date(item.createdAt), 'PPpp')}
                </p>
              </div>
              {item.reviewedAt && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">{t('detail.reviewedAt')}</span>
                  <p className="mt-1 text-sm">
                    {format(new Date(item.reviewedAt), 'PPpp')}
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {item.status === 'pending' && (
              <Button onClick={handleMarkReviewed} disabled={isMarkingReviewed} data-testid="mark-reviewed-btn">
                {isMarkingReviewed ? '...' : t('actions.markReviewed')}
              </Button>
            )}
            {item.status !== 'archived' && (
              <Button variant="outline" onClick={handleArchive} disabled={isArchiving} data-testid="archive-feedback-btn">
                {isArchiving ? '...' : t('actions.archive')}
              </Button>
            )}
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} data-testid="delete-feedback-btn">
              {t('actions.delete')}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('detail.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="delete-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('actions.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('actions.deleteConfirmMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder={t('actions.deleteConfirmPlaceholder')}
            value={deleteConfirmText}
            onChange={e => setDeleteConfirmText(e.target.value)}
            data-testid="delete-confirm-input"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
              {t('actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirmText !== 'delete' || isDeleting}
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete-btn"
            >
              {isDeleting ? t('actions.deleting') : t('actions.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
