'use client';

import type { User } from '@supabase/supabase-js';
import { Loader2, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRouter } from '@/libs/i18nNavigation';
import { createClient } from '@/libs/supabase/client';

type UserProfileSectionProps = {
  /** When true, show compact version (avatar only) */
  collapsed?: boolean;
};

/**
 * UserProfileSection Component
 * Displays user avatar, name, email and logout button in sidebar footer
 * Supports collapsed state (avatar only with tooltip) and expanded state
 */
export function UserProfileSection({ collapsed = false }: UserProfileSectionProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fix #9: Add unmount guard to prevent state updates after unmount
  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (isMounted) {
        setUser(authUser);
        setLoading(false);
      }
    };

    fetchUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fix #9: Add error handling and loading state for logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout failed:', error);
        setIsLoggingOut(false);
        return;
      }
      router.push('/sign-in');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  // Get display name and initials
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const email = user?.email || '';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (loading) {
    return (
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} py-2`}>
        <div className="size-9 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
        {!collapsed && (
          <div className="flex-1 space-y-1">
            <div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        )}
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Collapsed state: Just avatar with tooltip (no logout icon - MagicPatterns style)
  if (collapsed) {
    return (
      <div className="flex flex-col items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex size-9 cursor-default items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
              {initials}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  // Expanded state: Full profile row with subtle logout - MagicPatterns style
  return (
    <div className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
      {/* Avatar */}
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
        {initials}
      </div>
      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
          {displayName}
        </p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {email}
        </p>
      </div>
      {/* Subtle logout icon - MagicPatterns style: ml-auto text-slate-400 group-hover:text-slate-600 */}
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="ml-auto text-slate-400 transition-colors disabled:opacity-50 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
        aria-label={isLoggingOut ? 'Logging out...' : 'Logout'}
      >
        {isLoggingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      </button>
    </div>
  );
}
