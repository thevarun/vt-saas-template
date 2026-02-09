/**
 * PostHog Provider Component
 * Initializes analytics on app mount
 */

'use client';

import { useEffect } from 'react';

import { initAnalytics } from '@/libs/analytics';

type PostHogProviderProps = {
  children: React.ReactNode;
};

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    initAnalytics();
  }, []);

  return children;
}
