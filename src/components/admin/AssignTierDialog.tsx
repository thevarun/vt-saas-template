'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ActiveTier } from '@/libs/actions/subscriptions';
import { assignTier, getActiveTiers } from '@/libs/actions/subscriptions';
import { useUserSubscriptionDetail } from '@/libs/hooks/use-user-subscription-detail';

// Tier slugs the promotion-eligibility guard keys off — must match the server
// action's PROMO_TIER_NAME / PAID_TIER_NAMES (see libs/actions/subscriptions.ts).
// The template ships generic 'free' / 'pro' / 'promotion' slugs; a fork keeps
// the slugs and only re-skins the display copy.
const PROMO_TIER_NAME = 'promotion';
const PAID_TIER_NAMES = ['pro'];

// Client-side form schema (trialExpiresAt is a date string, not ISO datetime).
const assignTierFormSchema = z.object({
  tierId: z.string().uuid('Tier is required'),
  status: z.enum(['active', 'trial', 'expired', 'cancelled']),
  trialExpiresAt: z.string().optional(),
  expiresAt: z.string().optional(),
  reason: z.string().max(500).optional(),
}).refine(
  data => !(data.status === 'trial' && !data.trialExpiresAt),
  { message: 'Trial expiry date is required when status is trial', path: ['trialExpiresAt'] },
);

type AssignTierFormValues = z.infer<typeof assignTierFormSchema>;

type AssignTierDialogProps = {
  userId: string;
  userEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function AssignTierDialog({
  userId,
  userEmail,
  open,
  onOpenChange,
  onSaved,
}: AssignTierDialogProps) {
  const t = useTranslations('Admin.AssignTier');
  const [isPending, startTransition] = useTransition();

  // Fetch tiers for the dropdown.
  const { data: tiers } = useQuery<ActiveTier[]>({
    queryKey: ['active-tiers'],
    queryFn: async () => {
      const result = await getActiveTiers();
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    staleTime: 60_000,
  });

  // Fetch the current subscription to pre-fill the form.
  const { data: subscriptionDetail } = useUserSubscriptionDetail(open ? userId : null);

  const form = useForm<AssignTierFormValues>({
    resolver: zodResolver(assignTierFormSchema),
    defaultValues: {
      tierId: '',
      status: 'active',
      trialExpiresAt: '',
      expiresAt: '',
      reason: '',
    },
  });

  const watchedStatus = form.watch('status');
  const watchedTierId = form.watch('tierId');
  const selectedTier = tiers?.find(tier => tier.id === watchedTierId);
  const isPromotionTier = selectedTier?.name === PROMO_TIER_NAME;
  const currentTierName = subscriptionDetail?.tierName;
  // Promotion can only be granted to free or trial users — not active paid users.
  const cannotGrantPromotion
    = isPromotionTier
      && !!currentTierName
      && PAID_TIER_NAMES.includes(currentTierName)
      && subscriptionDetail?.status === 'active';

  // Pre-fill the form when subscription data loads.
  useEffect(() => {
    if (open && subscriptionDetail) {
      // Default promotion expiry: 1 month from today.
      const defaultExpiresAt = new Date();
      defaultExpiresAt.setMonth(defaultExpiresAt.getMonth() + 1);

      form.reset({
        tierId: subscriptionDetail.tierId,
        status: subscriptionDetail.status,
        trialExpiresAt: subscriptionDetail.trialExpiresAt
          ? new Date(subscriptionDetail.trialExpiresAt).toISOString().slice(0, 10)
          : '',
        expiresAt: subscriptionDetail.expiresAt
          ? new Date(subscriptionDetail.expiresAt).toISOString().slice(0, 10)
          : defaultExpiresAt.toISOString().slice(0, 10),
        reason: '',
      });
    }
  }, [open, subscriptionDetail, form]);

  const onSubmit = (data: AssignTierFormValues) => {
    startTransition(async () => {
      // Convert date strings to ISO datetimes for the server action.
      const trialExpiresAt = data.status === 'trial' && data.trialExpiresAt
        ? new Date(`${data.trialExpiresAt}T23:59:59.999Z`).toISOString()
        : null;

      const expiresAt = isPromotionTier && data.expiresAt
        ? new Date(`${data.expiresAt}T23:59:59.999Z`).toISOString()
        : null;

      const result = await assignTier({
        userId,
        tierId: data.tierId,
        status: data.status,
        trialExpiresAt,
        expiresAt,
        reason: data.reason || undefined,
      });

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      toast.success(t('success'));
      onSaved();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]" data-testid="assign-tier-dialog">
        <DialogHeader>
          <DialogTitle>{t('title', { email: userEmail })}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Tier Select */}
            <FormField
              control={form.control}
              name="tierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.tier')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="tier-select">
                        <SelectValue placeholder={t('placeholders.tier')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tiers?.map(tier => (
                        <SelectItem key={tier.id} value={tier.id}>
                          {tier.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status Select */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.status')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="status-select">
                        <SelectValue placeholder={t('placeholders.status')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">{t('statuses.active')}</SelectItem>
                      <SelectItem value="trial">{t('statuses.trial')}</SelectItem>
                      <SelectItem value="expired">{t('statuses.expired')}</SelectItem>
                      <SelectItem value="cancelled">{t('statuses.cancelled')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Trial Expiry Date — shown only when status is trial. */}
            {watchedStatus === 'trial' && (
              <FormField
                control={form.control}
                name="trialExpiresAt"
                render={({ field: { ref: _ref, ...field } }) => (
                  <FormItem>
                    <FormLabel>{t('fields.trialExpiry')}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        min={new Date().toISOString().slice(0, 10)}
                        {...field}
                        data-testid="trial-expiry-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Promotion End Date — shown only when a promotion tier is active. */}
            {isPromotionTier && watchedStatus === 'active' && (
              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field: { ref: _ref, ...field } }) => (
                  <FormItem>
                    <FormLabel>{t('fields.promotionEnd')}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        min={new Date().toISOString().slice(0, 10)}
                        {...field}
                        data-testid="expires-at-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {cannotGrantPromotion && (
              <p className="text-sm text-destructive" role="alert" data-testid="promotion-eligibility-warning">
                {t('promotionEligibilityWarning')}
              </p>
            )}

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('fields.reason')}
                    <span className="ml-1 text-xs text-muted-foreground">{t('fields.reasonHint')}</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('placeholders.reason')}
                      maxLength={500}
                      rows={2}
                      name={field.name}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={field.disabled}
                      data-testid="reason-textarea"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isPending || cannotGrantPromotion}
                data-testid="assign-tier-submit"
              >
                {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                {t('assign')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
