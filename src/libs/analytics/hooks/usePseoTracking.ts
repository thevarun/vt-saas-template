import { useEffect } from 'react';

import { trackEvent } from '@/libs/analytics';

/**
 * usePseoTracking Hook
 *
 * Tracks pSEO page views on mount. Alternative to PseoPageTracker component.
 * Automatically captures referrer from document.referrer.
 *
 * @param category - pSEO category (e.g., 'tools', 'templates', 'guides')
 * @param slug - Page slug identifier (e.g., 'password-generator')
 *
 * @example
 * ```tsx
 * // In a client component
 * 'use client'
 * import { usePseoTracking } from '@/libs/analytics'
 *
 * export function PseoPageClient({ category, slug }) {
 *   usePseoTracking(category, slug)
 *
 *   return (
 *     <div>
 *       {/* page content *\/}
 *     </div>
 *   )
 * }
 * ```
 */
export function usePseoTracking(category: string, slug: string): void {
  useEffect(() => {
    const referrer = document.referrer || undefined;

    trackEvent('pseo_page_viewed', {
      category,
      slug,
      referrer,
    });
  }, [category, slug]);
}

export default usePseoTracking;
