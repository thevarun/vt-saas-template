import { text, timestamp } from 'drizzle-orm/pg-core';

import { vtSaasSchema } from './_db-schema';

/**
 * Idempotency ledger for the Stripe webhook (`/api/stripe/webhook`).
 *
 * On a non-2xx response Stripe retries the SAME `event.id` (and may redeliver on
 * its own). The DB status writes the webhook performs are idempotent, but its
 * side effects are NOT — the `subscription_converted` analytics event and the
 * started/ended lifecycle emails would double-fire on every retry. The webhook
 * claims each `event.id` here (insert ... ON CONFLICT DO NOTHING) before dispatch
 * and sets `processed_at` only once the handler succeeds.
 *
 * Dedupe is keyed on COMPLETION, not mere existence: a row with `processed_at`
 * set is a true duplicate (skip); a row still NULL is a claim from a prior
 * attempt that never finished (handler threw) and MUST be reprocessed. This is
 * why we never delete on failure — leaving the row NULL keeps the event
 * reprocessable on Stripe's retry, with no risk of a delete failing and
 * orphaning the claim (which would permanently drop the event's side effects →
 * paid-but-not-provisioned).
 *
 * Server-only: written by the trusted webhook handler. RLS is ON with no policy
 * in prod-setup.sql (service role bypasses RLS), so it is not reachable over the
 * REST API. No FK to auth.users — keyed solely by Stripe's event id.
 */
export const stripeWebhookEvents = vtSaasSchema.table('stripe_webhook_events', {
  // Stripe's `event.id` (e.g. "evt_..."), globally unique — used as the PK so a
  // retried delivery conflicts on insert.
  eventId: text('event_id').primaryKey(),
  eventType: text('event_type').notNull(),
  // When the claim was first inserted (observability for stuck/incomplete rows).
  receivedAt: timestamp('received_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  // NULL until the handler completes successfully. NULL = reprocessable.
  processedAt: timestamp('processed_at', { withTimezone: true }),
});

export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect;
export type InsertStripeWebhookEvent = typeof stripeWebhookEvents.$inferInsert;
