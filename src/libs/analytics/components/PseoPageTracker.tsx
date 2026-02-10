'use client';

import { useEffect } from 'react';

import { trackEvent } from '@/libs/analytics';

/**
 * Props for PseoPageTracker component
 */
export type PseoPageTrackerProps = {
  /** pSEO category (e.g., 'tools', 'templates', 'guides') */
  category: string;
  /** Page slug identifier (e.g., 'password-generator') */
  slug: string;
};

/**
 * PseoPageTracker Component
 *
 * Invisible component that tracks pSEO page views on mount.
 * Automatically captures referrer from document.referrer.
 *
 * @example
 * ```tsx
 * // In a pSEO page component
 * import { PseoPageTracker } from '@/libs/analytics'
 *
 * export default async function PseoPage({ params }) {
 *   const { category, slug } = await params
 *
 *   return (
 *     <>
 *       <PseoPageTracker category={category} slug={slug} />
 *       {/* page content *\/}
 *     </>
 *   )
 * }
 * ```
 */
export function PseoPageTracker({ category, slug }: PseoPageTrackerProps): null {
  useEffect(() => {
    const referrer = document.referrer || undefined;

    trackEvent('pseo_page_viewed', {
      category,
      slug,
      referrer,
    });
  }, [category, slug]); // Re-track when category or slug changes (client-side navigation)

  return null;
}

export default PseoPageTracker;
