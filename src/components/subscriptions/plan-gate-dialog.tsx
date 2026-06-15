'use client';

import { format } from 'date-fns';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSubscriptionUsage } from '@/libs/hooks/use-subscription-usage';

// Where the upgrade CTA links. A product repoints this.
const BILLING_PATH = '/subscriptions';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional ISO date the quota resets on, surfaced in the copy. */
  resetsAt?: string | null;
};

/**
 * Generic plan-gate upsell dialog shown when a user exhausts a quota. On a top
 * tier (pro/promotion) it just states when the quota resets; otherwise it
 * surfaces an upgrade CTA. A product passes its own open/close state (e.g. from
 * a quota error on a gated action).
 *
 * One reusable gate in place of feature-specific upsell dialogs.
 */
export function PlanGateDialog({ open, onOpenChange, resetsAt }: Props) {
  const { data } = useSubscriptionUsage();

  const isTopTier = data?.tier.name === 'pro' || data?.tier.name === 'promotion';
  const formattedDate = resetsAt ? format(new Date(resetsAt), 'MMM d') : 'soon';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>You've hit your limit</DialogTitle>
          <DialogDescription>
            {isTopTier
              ? `You're on the top tier — your quota resets on ${formattedDate}.`
              : `You've used your quota for this period — it resets on ${formattedDate}. Upgrade for higher limits.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {!isTopTier && (
            <Button asChild onClick={() => onOpenChange(false)}>
              <Link href={BILLING_PATH}>Upgrade</Link>
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
