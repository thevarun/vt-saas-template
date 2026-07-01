/**
 * User Identifier Component
 * Identifies users in analytics when authenticated
 */

'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

import { identifyUser, resetUser } from '@/libs/analytics';
import { createClient } from '@/libs/supabase/client';

export function UserIdentifier() {
  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        identifyUser(user.id, {
          email: user.email,
          createdAt: new Date(user.created_at),
        });
        Sentry.setUser({ id: user.id });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        identifyUser(session.user.id, {
          email: session.user.email,
          createdAt: new Date(session.user.created_at),
        });
        Sentry.setUser({ id: session.user.id });
      } else if (event === 'SIGNED_OUT') {
        resetUser();
        Sentry.setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
