'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { useToast } from '@/hooks/use-toast';

export function AccessDeniedToast() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const t = useTranslations('Errors');

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'access_denied') {
      toast({
        title: t('admin.accessDenied'),
        description: t('admin.contactAdmin'),
        variant: 'destructive',
      });

      // Remove query param from URL without page reload
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, toast, t]);

  return null;
}
