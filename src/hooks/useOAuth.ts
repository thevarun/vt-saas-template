'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';

import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/libs/supabase/client';

/**
 * Shared OAuth handlers for sign-in and sign-up pages.
 * Both flows use identical Supabase signInWithOAuth calls.
 */
export function useOAuth() {
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();
  const [oauthLoading, setOAuthLoading] = useState(false);

  const handleGoogle = async (errorMessage: string) => {
    setOAuthLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/${locale}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setOAuthLoading(false);
    }
    // If no error, user will be redirected to OAuth provider
    // Loading state persists until redirect completes
  };

  const handleGitHub = async (errorMessage: string) => {
    setOAuthLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/${locale}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setOAuthLoading(false);
    }
    // If no error, user will be redirected to OAuth provider
    // Loading state persists until redirect completes
  };

  return { oauthLoading, handleGoogle, handleGitHub };
}
