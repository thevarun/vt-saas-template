'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { createPortalSession } from '@/libs/actions/billing';
import { useSubscriptionUsage } from '@/libs/hooks/use-subscription-usage';

import {
  copyForBanner,
  pickBanner,
  STORAGE_PREFIX,
  thresholdForDays,
} from './expiry-banner-logic';

export function ExpiryBanner() {
  const { data } = useSubscriptionUsage();
  const [dismissed, setDismissed] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  const banner = data
    ? pickBanner({
        status: data.subscription.status,
        tierName: data.tier.name,
        trialExpiresAt: data.subscription.trialExpiresAt,
        expiresAt: data.subscription.expiresAt,
      })
    : null;

  // Reset dismissed state when banner identity changes.
  useEffect(() => {
    setDismissed(false);
  }, [banner?.variant, banner?.endDate]);

  // Read localStorage to see if this threshold was already dismissed.
  useEffect(() => {
    if (!banner || banner.daysLeft === 0) {
      return;
    }
    const threshold = thresholdForDays(banner.daysLeft);
    if (!threshold) {
      return;
    }
    try {
      const key = `${STORAGE_PREFIX}:${banner.variant}:${threshold}`;
      if (typeof window !== 'undefined' && window.localStorage.getItem(key)) {
        setDismissed(true);
      }
    } catch {
      // localStorage unavailable; show by default
    }
  }, [banner]);

  if (!banner || dismissed) {
    return null;
  }

  const { title, cta, href } = copyForBanner(banner);
  const isDayOf = banner.daysLeft === 0;
  const isReactivate = banner.variant === 'cancelled-paid';

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      const result = await createPortalSession({ intent: 'reactivate' });
      if (result.error) {
        toast.error(result.error.message);
        setReactivating(false);
        return;
      }
      window.location.href = result.data.portalUrl;
    } catch {
      toast.error('Failed to open billing portal. Please try again.');
      setReactivating(false);
    }
  };

  const handleDismiss = () => {
    if (isDayOf) {
      return;
    }
    const threshold = thresholdForDays(banner.daysLeft);
    if (threshold) {
      try {
        window.localStorage.setItem(
          `${STORAGE_PREFIX}:${banner.variant}:${threshold}`,
          new Date().toISOString(),
        );
      } catch {
        // ignore
      }
    }
    setDismissed(true);
  };

  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <span className="flex-1">{title}</span>
      <div className="flex shrink-0 items-center gap-2">
        {isReactivate
          ? (
              <Button size="sm" variant="default" onClick={handleReactivate} disabled={reactivating}>
                {reactivating && <Loader2 className="mr-2 size-4 animate-spin" />}
                {cta}
              </Button>
            )
          : (
              <Button asChild size="sm" variant="default">
                <Link href={href}>{cta}</Link>
              </Button>
            )}
        {!isDayOf && (
          <Button size="sm" variant="ghost" onClick={handleDismiss}>
            Dismiss
          </Button>
        )}
      </div>
    </div>
  );
}
