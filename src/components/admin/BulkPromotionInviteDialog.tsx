'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
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
import { bulkAssignTier, getActiveTiers } from '@/libs/actions/subscriptions';

// Must match the server action's PROMO_TIER_NAME (libs/actions/subscriptions.ts).
const PROMO_TIER_NAME = 'promotion';

// Client-side form schema. A single `expiryDate` field maps to either
// `trialExpiresAt` or `expiresAt` at submit time based on tier + status.
const bulkAssignFormSchema = z.object({
  emailsRaw: z.string().min(1, 'At least one email is required').max(10_000),
  tierId: z.string().uuid('Tier is required'),
  status: z.enum(['active', 'trial']),
  expiryDate: z.string().optional(),
});

type BulkAssignFormValues = z.infer<typeof bulkAssignFormSchema>;

type BulkPromotionInviteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BulkPromotionInviteDialog({
  open,
  onOpenChange,
}: BulkPromotionInviteDialogProps) {
  const t = useTranslations('Admin.BulkAssign');
  const [isPending, startTransition] = useTransition();
  const [phase, setPhase] = useState<'form' | 'results'>('form');
  const [results, setResults] = useState<{ updated: string[]; not_found: string[] } | null>(null);

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

  // Find the promotion tier id for the default selection.
  const promotionTierId = tiers?.find(tier => tier.name === PROMO_TIER_NAME)?.id ?? '';

  const form = useForm<BulkAssignFormValues>({
    resolver: zodResolver(bulkAssignFormSchema),
    defaultValues: {
      emailsRaw: '',
      tierId: '',
      status: 'trial',
      expiryDate: '',
    },
  });

  const watchedStatus = form.watch('status');
  const watchedTierId = form.watch('tierId');
  const selectedTier = tiers?.find(tier => tier.id === watchedTierId);
  const isPromotionTier = selectedTier?.name === PROMO_TIER_NAME;
  // The expiry field is required when:
  //   - status='trial' (any tier)            → maps to trial_expires_at
  //   - tier='promotion' AND status='active' → maps to expires_at
  const showExpiryField = watchedStatus === 'trial' || (isPromotionTier && watchedStatus === 'active');
  const expiryFieldLabel = watchedStatus === 'trial' ? t('fields.trialExpiry') : t('fields.promotionEnd');

  // Default to the promotion tier once tiers load.
  useEffect(() => {
    if (promotionTierId && !form.getValues('tierId')) {
      form.setValue('tierId', promotionTierId);
    }
  }, [promotionTierId, form]);

  // Reset on dialog close.
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      setPhase('form');
      setResults(null);
      form.reset({
        emailsRaw: '',
        tierId: promotionTierId || '',
        status: 'trial',
        expiryDate: '',
      });
    }
    onOpenChange(newOpen);
  }, [onOpenChange, form, promotionTierId]);

  const onSubmit = (data: BulkAssignFormValues) => {
    // Client-side guard for the conditional expiry field. Server re-validates.
    const tierName = tiers?.find(tier => tier.id === data.tierId)?.name;
    const expiryRequired = data.status === 'trial' || (tierName === PROMO_TIER_NAME && data.status === 'active');
    if (expiryRequired && !data.expiryDate) {
      form.setError('expiryDate', {
        message: data.status === 'trial'
          ? 'Trial expiry date is required when status is trial'
          : 'Promotion end date is required',
      });
      return;
    }

    startTransition(async () => {
      const isoDateTime = data.expiryDate
        ? new Date(`${data.expiryDate}T23:59:59.999Z`).toISOString()
        : null;

      const result = await bulkAssignTier({
        emailsRaw: data.emailsRaw,
        tierId: data.tierId,
        status: data.status,
        // Trial expiry vs promotion expiry route to different DB columns.
        trialExpiresAt: data.status === 'trial' ? isoDateTime : null,
        expiresAt: tierName === PROMO_TIER_NAME && data.status === 'active' ? isoDateTime : null,
      });

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      setResults(result.data);
      setPhase('results');
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="bulk-assign-dialog">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        {phase === 'form'
          ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Emails Textarea */}
                  <FormField
                    control={form.control}
                    name="emailsRaw"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('fields.emails')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('placeholders.emails')}
                            rows={6}
                            maxLength={10_000}
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            disabled={field.disabled}
                            data-testid="emails-textarea"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tier Select */}
                  <FormField
                    control={form.control}
                    name="tierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('fields.tier')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="bulk-tier-select">
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
                            <SelectTrigger data-testid="bulk-status-select">
                              <SelectValue placeholder={t('placeholders.status')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">{t('statuses.active')}</SelectItem>
                            <SelectItem value="trial">{t('statuses.trial')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Expiry date — for trial (any tier) or active + promotion. */}
                  {showExpiryField && (
                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field: { ref: _ref, ...field } }) => (
                        <FormItem>
                          <FormLabel>{expiryFieldLabel}</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              min={new Date().toISOString().slice(0, 10)}
                              {...field}
                              data-testid="bulk-trial-expiry-input"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <p className="text-xs text-muted-foreground">
                    {t('notFoundHint')}
                  </p>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOpenChange(false)}
                      disabled={isPending}
                    >
                      {t('cancel')}
                    </Button>
                    <Button type="submit" disabled={isPending} data-testid="bulk-assign-submit">
                      {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                      {t('assign')}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )
          : (
              <div className="space-y-4">
                {/* Results */}
                {results && results.updated.length > 0 && (
                  <section className="space-y-2">
                    <Badge variant="active">
                      {t('results.updated', { count: results.updated.length })}
                    </Badge>
                    <ul className="max-h-40 space-y-1 overflow-y-auto text-sm" data-testid="updated-emails-list">
                      {results.updated.map(email => (
                        <li key={email}>{email}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {results && results.not_found.length > 0 && (
                  <section className="space-y-2">
                    <Badge variant="secondary">
                      {t('results.notFound', { count: results.not_found.length })}
                    </Badge>
                    <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-muted-foreground" data-testid="not-found-emails-list">
                      {results.not_found.map(email => (
                        <li key={email}>{email}</li>
                      ))}
                    </ul>
                  </section>
                )}

                <DialogFooter>
                  <Button onClick={() => handleOpenChange(false)} data-testid="bulk-assign-done">
                    {t('done')}
                  </Button>
                </DialogFooter>
              </div>
            )}
      </DialogContent>
    </Dialog>
  );
}
