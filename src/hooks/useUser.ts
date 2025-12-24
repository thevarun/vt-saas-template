'use client';

import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { createClient } from '@/libs/supabase/client';

/**
 * Client-side hook to get the current authenticated user.
 * Returns null initially and during loading to prevent flicker.
 * Best practice for public pages with personalization.
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
