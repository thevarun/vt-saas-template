/**
 * PostHog Provider Component
 * Initializes analytics after browser idle to avoid blocking page load
 */

'use client';

import { useEffect } from 'react';

import { initAnalytics } from '@/libs/analytics';

type PostHogProviderProps = {
  children: React.ReactNode;
};

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    const init = () => initAnalytics();
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(init);
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(init, 1);
    return () => clearTimeout(timer);
  }, []);

  return children;
}
