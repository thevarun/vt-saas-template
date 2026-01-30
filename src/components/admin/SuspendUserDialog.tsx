'use client';

import type { User } from '@supabase/supabase-js';
import { Ban, CheckCircle } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

type SuspendUserDialogProps = {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSuspended: boolean;
  onSuccess: (updatedUser?: User) => void;
};

export function SuspendUserDialog({
  user,
  open,
  onOpenChange,
  isSuspended,
  onSuccess,
}: SuspendUserDialogProps) {
  const t = useTranslations('Admin.UserDetail');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async () => {
    setIsLoading(true);

    try {
      const endpoint = isSuspended
        ? `/api/admin/users/${user.id}/unsuspend`
        : `/api/admin/users/${user.id}/suspend`;

      const response = await fetch(endpoint, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user status');
      }

      const data = await response.json();

      toast({
        title: isSuspended ? t('unsuspend.success') : t('suspend.success'),
        description: isSuspended
          ? t('unsuspend.successDesc')
          : t('suspend.successDesc'),
      });

      onOpenChange(false);
      onSuccess(data.user);
    } catch (error) {
      console.error('Suspend/unsuspend user error:', error);
      toast({
        title: isSuspended ? t('unsuspend.error') : t('suspend.error'),
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[420px]" data-testid="suspend-user-dialog">
        <AlertDialogHeader className="text-center sm:text-center">
          <div className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-full ${
            isSuspended
              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
          }`}
          >
            {isSuspended
              ? <CheckCircle className="size-6" />
              : <Ban className="size-6" />}
          </div>
          <AlertDialogTitle>
            {isSuspended
              ? t('unsuspend.title', { email: user.email ?? '' })
              : t('suspend.title', { email: user.email ?? '' })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isSuspended ? t('unsuspend.description') : t('suspend.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {t('cancel')}
          </AlertDialogCancel>
          <Button
            onClick={handleAction}
            disabled={isLoading}
            variant={isSuspended ? 'default' : 'destructive'}
            className={isSuspended ? '' : 'bg-amber-600 hover:bg-amber-700'}
            data-testid={isSuspended ? 'unsuspend-confirm-button' : 'suspend-confirm-button'}
          >
            {isLoading
              ? (isSuspended ? t('unsuspend.loading') : t('suspend.loading'))
              : (isSuspended ? t('unsuspend.confirm') : t('suspend.confirm'))}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
