'use client';

import type { User } from '@supabase/supabase-js';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

type DeleteUserDialogProps = {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function DeleteUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: DeleteUserDialogProps) {
  const t = useTranslations('Admin.UserDetail');
  const { toast } = useToast();
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Case-insensitive email comparison
  const isConfirmed = confirmEmail.toLowerCase() === user.email?.toLowerCase();

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmEmail('');
    }
    onOpenChange(newOpen);
  };

  const handleDelete = async () => {
    if (!isConfirmed) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      toast({
        title: t('delete.success'),
        description: t('delete.successDesc'),
      });

      handleOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Delete user error:', error);
      toast({
        title: t('delete.error'),
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-[420px]" data-testid="delete-user-dialog">
        <AlertDialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <AlertTriangle className="size-6" />
          </div>
          <AlertDialogTitle>
            {t('delete.title', { email: user.email ?? '' })}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left text-sm text-muted-foreground">
              <p className="font-semibold text-destructive">
                {t('delete.warningStrong')}
              </p>
              <p>
                {t('delete.description')}
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>{t('delete.dataProfile')}</li>
                <li>{t('delete.dataActivity')}</li>
                <li>{t('delete.dataContent')}</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <label className="text-sm" htmlFor="confirm-email">
            {t('delete.confirmPrompt')}
            {' '}
            <span className="font-mono font-semibold">{user.email}</span>
          </label>
          <Input
            id="confirm-email"
            placeholder={t('delete.placeholder')}
            value={confirmEmail}
            onChange={e => setConfirmEmail(e.target.value)}
            autoComplete="off"
            data-testid="delete-confirm-input"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {t('cancel')}
          </AlertDialogCancel>
          <Button
            onClick={handleDelete}
            disabled={!isConfirmed || isLoading}
            variant="destructive"
            data-testid="delete-confirm-button"
          >
            <Trash2 className="mr-2 size-4" />
            {isLoading ? t('delete.loading') : t('delete.confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
