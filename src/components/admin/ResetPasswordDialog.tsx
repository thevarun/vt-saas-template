'use client';

import type { User } from '@supabase/supabase-js';
import { Key, Mail } from 'lucide-react';
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

type ResetPasswordDialogProps = {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ResetPasswordDialog({
  user,
  open,
  onOpenChange,
}: ResetPasswordDialogProps) {
  const t = useTranslations('Admin.UserDetail');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send reset email');
      }

      toast({
        title: t('resetPassword.success'),
        description: t('resetPassword.successNote'),
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        title: t('resetPassword.error'),
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[420px]" data-testid="reset-password-dialog">
        <AlertDialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Key className="size-6" />
          </div>
          <AlertDialogTitle>
            {t('resetPassword.title')}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>{t('resetPassword.description')}</p>
            <p className="flex items-center justify-center gap-2 font-medium text-foreground">
              <Mail className="size-4" />
              {user.email}
            </p>
            <p className="text-sm">
              {t('resetPassword.note')}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {t('cancel')}
          </AlertDialogCancel>
          <Button
            onClick={handleResetPassword}
            disabled={isLoading}
            data-testid="reset-password-confirm-button"
          >
            <Mail className="mr-2 size-4" />
            {isLoading ? t('resetPassword.loading') : t('resetPassword.confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
