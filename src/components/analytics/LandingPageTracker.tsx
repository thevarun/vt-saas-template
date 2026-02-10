'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { captureReferralParams, extractUtmParams, trackLandingViewed } from '@/libs/analytics';

/**
 * Landing Page Analytics Tracker
 * Tracks landing page views and captures referral parameters
 * Should be mounted in the landing page component
 */
export function LandingPageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track landing view only once per session
    const hasTrackedLanding = sessionStorage.getItem('landing_tracked');
    if (hasTrackedLanding) {
      return;
    }

    // Capture referral params for later use (persists through signup)
    captureReferralParams();

    // Extract locale from pathname (format: /[locale] or /[locale]/...)
    const locale = pathname.split('/')[1] || 'en';

    // Extract UTM parameters if present
    const utmParams = extractUtmParams();

    // Get ref parameter for landing event
    const refParam = searchParams.get('ref') || searchParams.get('referrer');

    // Track landing view
    trackLandingViewed({
      page_url: window.location.href,
      locale,
      referrer: document.referrer || undefined,
      ref: refParam || undefined,
      ...utmParams,
    });

    // Mark as tracked to prevent duplicate events
    sessionStorage.setItem('landing_tracked', 'true');
  }, [pathname, searchParams]);

  return null; // No UI, just tracking
}
