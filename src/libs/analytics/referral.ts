/**
 * Referral Tracking Utilities
 * Capture and manage referral parameters from URLs
 */

const REFERRAL_STORAGE_KEY = 'analytics_referral';
const REFERRAL_PARAMS = ['ref', 'referrer'] as const;
const UTM_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

/**
 * Referral information stored in sessionStorage
 */
export type ReferralInfo = {
  source?: string;
  userId?: string;
};

/**
 * Sanitize parameter value to prevent XSS and injection attacks
 *
 * @param value - Raw parameter value
 * @returns Sanitized value
 */
function sanitizeParam(value: string): string {
  // Remove potentially dangerous characters
  return value
    .replace(/[<>'"]/g, '')
    .substring(0, 100) // Limit length
    .trim();
}

/**
 * Check if sessionStorage is available
 * Handles cases where storage is disabled (privacy mode, etc.)
 *
 * @returns True if sessionStorage is available
 */
function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract UTM parameters from current URL
 *
 * @returns Object with UTM parameters (only includes present params)
 *
 * @example
 * ```tsx
 * // URL: ?utm_source=google&utm_medium=cpc
 * const utm = extractUtmParams()
 * // Returns: { utm_source: 'google', utm_medium: 'cpc' }
 * ```
 */
export function extractUtmParams(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }

  const params = new URLSearchParams(window.location.search);
  const utmParams: Record<string, string> = {};

  for (const param of UTM_PARAMS) {
    const value = params.get(param);
    if (value) {
      utmParams[param] = sanitizeParam(value);
    }
  }

  return utmParams;
}

/**
 * Capture referral parameters from URL and store in sessionStorage
 * Captures: ref, referrer, utm_source
 * First-touch attribution: Only captures if no referral already stored
 *
 * @example
 * ```tsx
 * // In landing page component
 * useEffect(() => {
 *   captureReferralParams()
 * }, [])
 * ```
 */
export function captureReferralParams(): void {
  if (typeof window === 'undefined' || !isStorageAvailable()) {
    return;
  }

  // First-touch attribution: don't override existing referral
  const existing = sessionStorage.getItem(REFERRAL_STORAGE_KEY);
  if (existing) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const referralInfo: ReferralInfo = {};

  // Check for referral code parameters
  for (const param of REFERRAL_PARAMS) {
    const value = params.get(param);
    if (value) {
      referralInfo.source = sanitizeParam(value);
      // Extract user ID if format is "user-{id}"
      if (value.startsWith('user-')) {
        referralInfo.userId = sanitizeParam(value.substring(5));
      }
      break; // Use first match only
    }
  }

  // Fallback to utm_source if no referral code
  if (!referralInfo.source) {
    const utmSource = params.get('utm_source');
    if (utmSource) {
      referralInfo.source = sanitizeParam(utmSource);
    }
  }

  // Only store if we found something
  if (referralInfo.source) {
    sessionStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(referralInfo));
  }
}

/**
 * Get stored referral information
 *
 * @returns Referral info or null if none stored
 *
 * @example
 * ```tsx
 * const referralInfo = getReferralInfo()
 * if (referralInfo?.source) {
 *   console.log('Referred by:', referralInfo.source)
 * }
 * ```
 */
export function getReferralInfo(): ReferralInfo | null {
  if (typeof window === 'undefined' || !isStorageAvailable()) {
    return null;
  }

  try {
    const stored = sessionStorage.getItem(REFERRAL_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as ReferralInfo;
  } catch {
    // Invalid JSON - clear it
    sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
    return null;
  }
}

/**
 * Clear stored referral information
 * Call this after signup is complete
 *
 * @example
 * ```tsx
 * // After successful signup
 * trackSignupCompleted('email')
 * clearReferralInfo()
 * ```
 */
export function clearReferralInfo(): void {
  if (typeof window === 'undefined' || !isStorageAvailable()) {
    return;
  }

  sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
}
