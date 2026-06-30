import { differenceInDays, format } from 'date-fns';

/**
 * Pure decision logic for the expiry banner, split out of `expiry-banner.tsx` so
 * it can be unit-tested and so the component file only exports a component
 * (react-refresh/only-export-components). Product-agnostic.
 */

// Where the trial / promotion banner CTA links. A product repoints this.
export const BILLING_PATH = '/subscriptions';
export const BANNER_THRESHOLDS = [7, 3, 1] as const;
// localStorage namespace for "dismissed at threshold" state. A fork can swap
// this for an appName-derived prefix; it just needs to be unique per product.
export const STORAGE_PREFIX = 'vt-saas:expiry-banner-dismissed';

export type BannerVariant = 'trial' | 'promotion' | 'cancelled-paid';

export type BannerData = {
  variant: BannerVariant;
  daysLeft: number;
  endDate: string; // ISO
};

/**
 * Decides which expiry banner — if any — to show, based on the user's
 * subscription state. Covers three cases:
 *   - Trial expiry (status='trial', trialExpiresAt within 7 days)
 *   - Promotion expiry (tier='promotion', expiresAt within 7 days)
 *   - Paid cancellation winding down (tier='pro', status='active', expiresAt set
 *     — Stripe `cancel_at_period_end` set this)
 */
export function pickBanner(args: {
  status: 'active' | 'trial' | 'expired' | 'cancelled';
  tierName: string;
  trialExpiresAt: string | null;
  expiresAt: string | null;
  now?: Date;
}): BannerData | null {
  const now = args.now ?? new Date();

  if (args.status === 'trial' && args.trialExpiresAt) {
    const days = differenceInDays(new Date(args.trialExpiresAt), now);
    if (days <= 7) {
      return { variant: 'trial', daysLeft: Math.max(0, days), endDate: args.trialExpiresAt };
    }
  }

  if (args.tierName === 'promotion' && args.expiresAt) {
    const days = differenceInDays(new Date(args.expiresAt), now);
    if (days <= 7) {
      return { variant: 'promotion', daysLeft: Math.max(0, days), endDate: args.expiresAt };
    }
  }

  if (args.tierName === 'pro' && args.status === 'active' && args.expiresAt) {
    // cancel_at_period_end set — paid until expiresAt, then downgraded.
    const days = differenceInDays(new Date(args.expiresAt), now);
    return { variant: 'cancelled-paid', daysLeft: Math.max(0, days), endDate: args.expiresAt };
  }

  return null;
}

export function copyForBanner(banner: BannerData): { title: string; cta: string; href: string } {
  // Include the year so dates aren't ambiguous near year boundaries.
  const formattedDate = format(new Date(banner.endDate), 'MMM d, yyyy');

  if (banner.variant === 'trial') {
    if (banner.daysLeft === 0) {
      return {
        title: 'Your trial ends today. Subscribe to keep your plan.',
        cta: 'Subscribe',
        href: BILLING_PATH,
      };
    }
    return {
      title: `Your trial ends in ${banner.daysLeft} day${banner.daysLeft === 1 ? '' : 's'} (${formattedDate}). Subscribe to keep your plan.`,
      cta: 'Subscribe',
      href: BILLING_PATH,
    };
  }

  if (banner.variant === 'promotion') {
    if (banner.daysLeft === 0) {
      return {
        title: 'Your free access ends today. Subscribe to keep your plan.',
        cta: 'Subscribe',
        href: BILLING_PATH,
      };
    }
    return {
      title: `Your free access ends in ${banner.daysLeft} day${banner.daysLeft === 1 ? '' : 's'} (${formattedDate}). Subscribe to keep your plan.`,
      cta: 'Subscribe',
      href: BILLING_PATH,
    };
  }

  // cancelled-paid
  if (banner.daysLeft === 0) {
    return {
      title: `Your subscription ends today (${formattedDate}). Renew to keep your plan.`,
      cta: 'Reactivate',
      href: BILLING_PATH,
    };
  }
  return {
    title: `Your subscription ends on ${formattedDate}. Renew to keep your plan.`,
    cta: 'Reactivate',
    href: BILLING_PATH,
  };
}

export function thresholdForDays(daysLeft: number): number | null {
  for (const t of BANNER_THRESHOLDS) {
    if (daysLeft <= t) {
      return t;
    }
  }
  return null;
}
