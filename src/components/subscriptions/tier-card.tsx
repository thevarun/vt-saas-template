'use client';

import { Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn } from '@/utils/Helpers';

type BillingInterval = 'monthly' | 'yearly';

export type TierCardProps = {
  name: string;
  displayName: string;
  priceCents: number | null;
  /** Optional small badge above the feature list (e.g. a plan tagline). */
  badgeLabel?: string;
  features: readonly string[];
  ctaLabel: string;
  // 'destructive-outline' is a semantic intent (a downgrade) mapped below to an
  // outline button with destructive colours — not a built-in shadcn variant.
  ctaVariant: 'default' | 'outline' | 'destructive-outline';
  isCurrentPlan: boolean;
  isRecommended: boolean;
  isLoading?: boolean;
  /** Render the CTA as a non-actionable, disabled button. */
  disabled?: boolean;
  onCtaClick: () => void;
  /** Optional: enable billing-interval toggle. When set, priceCents is the monthly price. */
  billingInterval?: BillingInterval;
  yearlyPriceCents?: number;
  onBillingIntervalChange?: (interval: BillingInterval) => void;
};

function formatPrice(priceCents: number | null, interval: BillingInterval): string {
  if (priceCents === null) {
    return 'Invite Only';
  }
  if (priceCents === 0) {
    return '$0/month';
  }
  return interval === 'yearly'
    ? `$${priceCents / 100}/year`
    : `$${priceCents / 100}/month`;
}

export function TierCard({
  displayName,
  priceCents,
  badgeLabel,
  features,
  ctaLabel,
  ctaVariant,
  isCurrentPlan,
  isRecommended,
  isLoading,
  disabled,
  onCtaClick,
  billingInterval,
  yearlyPriceCents,
  onBillingIntervalChange,
}: TierCardProps) {
  const showToggle = Boolean(billingInterval && onBillingIntervalChange && yearlyPriceCents);
  const activeInterval: BillingInterval = billingInterval ?? 'monthly';
  const displayPriceCents = showToggle && activeInterval === 'yearly'
    ? (yearlyPriceCents ?? priceCents)
    : priceCents;

  return (
    <Card
      className={cn(
        'relative flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg',
        isRecommended && 'border-2 border-primary/40',
      )}
    >
      {isRecommended && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            Recommended
          </span>
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold">{displayName}</h3>
          {showToggle && onBillingIntervalChange && (
            <div className="inline-flex rounded-full border bg-muted/30 p-0.5">
              <button
                type="button"
                onClick={() => onBillingIntervalChange('monthly')}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  activeInterval === 'monthly'
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => onBillingIntervalChange('yearly')}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  activeInterval === 'yearly'
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Yearly
                <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                  2 months free
                </span>
              </button>
            </div>
          )}
        </div>
        <p className="text-3xl font-bold">
          {formatPrice(displayPriceCents, activeInterval)}
        </p>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {badgeLabel && (
          <span className="inline-block rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {badgeLabel}
          </span>
        )}

        <ul className="space-y-2">
          {features.map(feature => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {ctaVariant === 'destructive-outline'
          ? (
              <Button
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive/10"
                disabled={isCurrentPlan || isLoading || disabled}
                onClick={onCtaClick}
              >
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {ctaLabel}
              </Button>
            )
          : (
              <Button
                variant={ctaVariant}
                className="w-full"
                disabled={isCurrentPlan || isLoading || disabled}
                onClick={onCtaClick}
              >
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {ctaLabel}
              </Button>
            )}
      </CardFooter>
    </Card>
  );
}
