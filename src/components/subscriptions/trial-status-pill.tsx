'use client';

import { differenceInDays } from 'date-fns';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { useSubscriptionUsage } from '@/libs/hooks/use-subscription-usage';
import { cn } from '@/utils/Helpers';

type Props = {
  /** When true, render as a compact dot-only indicator (sidebar collapsed). */
  collapsed?: boolean;
};

// Where the pill links. A product repoints this to its billing page.
const BILLING_PATH = 'subscriptions';

/**
 * Persistent pill for users on an active trial or promotion, surfacing
 * "X days left" so trialing users have ambient awareness from day 1.
 *
 * Returns null for paid, free, or expired users — those cases are covered by
 * other UI (banners, upsell modal, billing-portal link).
 */
export function TrialStatusPill({ collapsed = false }: Props) {
  const params = useParams();
  const locale = params.locale as string;
  const { data } = useSubscriptionUsage();

  if (!data) {
    return null;
  }

  const { subscription, tier } = data;
  const now = new Date();

  let daysLeft: number | null = null;
  let label = '';

  if (subscription.status === 'trial' && subscription.trialExpiresAt) {
    daysLeft = Math.max(0, differenceInDays(new Date(subscription.trialExpiresAt), now));
    label = 'Trial';
  } else if (tier.name === 'promotion' && subscription.expiresAt) {
    daysLeft = Math.max(0, differenceInDays(new Date(subscription.expiresAt), now));
    label = 'Free access';
  } else {
    return null;
  }

  const urgent = daysLeft <= 3;
  const dayWord = daysLeft === 1 ? 'day' : 'days';

  return (
    <Link
      href={`/${locale}/${BILLING_PATH}`}
      aria-label={`${label} — ${daysLeft} ${dayWord} left`}
      className={cn(
        'flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
        urgent
          ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100'
          : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted',
        collapsed && 'justify-center px-2',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'inline-block size-2 shrink-0 rounded-full',
          urgent ? 'bg-amber-500' : 'bg-emerald-500',
        )}
      />
      {!collapsed && (
        <span className="truncate">
          {label}
          {' · '}
          {daysLeft}
          {' '}
          {dayWord}
          {' '}
          left
        </span>
      )}
    </Link>
  );
}
