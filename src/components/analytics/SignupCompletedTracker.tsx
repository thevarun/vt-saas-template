'use client';

import { useEffect } from 'react';

import { clearReferralInfo, getReferralInfo, trackReferredSignup, trackSignupCompleted } from '@/libs/analytics';

type SignupCompletedTrackerProps = {
  /** Signup method (email, google, github) */
  method: 'email' | 'google' | 'github';
  /** Whether this is a new user (just signed up) */
  isNewUser: boolean;
};

/**
 * Signup Completed Analytics Tracker
 * Tracks signup completion and referred signup events
 * Should be mounted in the first page after signup (onboarding)
 */
export function SignupCompletedTracker({ method, isNewUser }: SignupCompletedTrackerProps) {
  useEffect(() => {
    // Only track for new users who just completed signup
    if (!isNewUser) {
      return;
    }

    // Check if we've already tracked signup (prevent duplicates)
    const hasTrackedSignup = sessionStorage.getItem('signup_tracked');
    if (hasTrackedSignup) {
      return;
    }

    // Track signup completion
    trackSignupCompleted(method);

    // Track referred signup if referral info exists
    const referralInfo = getReferralInfo();
    if (referralInfo?.source) {
      trackReferredSignup(referralInfo.source, referralInfo.userId);
    }

    // Clear referral info after tracking
    clearReferralInfo();

    // Mark as tracked to prevent duplicate events
    sessionStorage.setItem('signup_tracked', 'true');
  }, [method, isNewUser]);

  return null; // No UI, just tracking
}
