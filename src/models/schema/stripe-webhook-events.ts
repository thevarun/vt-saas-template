import { text, timestamp } from 'drizzle-orm/pg-core';

import { vtSaasSchema } from './_db-schema';

/**
 * Idempotency ledger for the Stripe webhook (`/api/stripe/webhook`).
 *
 * On a non-2xx response Stripe retries the SAME `event.id`. The DB status writes
 * the webhook performs are idempotent, but its side effects are NOT — the
 * `subscription_converted` analytics event and the started/ended lifecycle emails
 * would double-fire on every retry. The webhook records each `event.id` here
 * exactly once (insert ... ON CONFLICT DO NOTHING) before doing anything else,
 * and short-circuits when the row already existed, so side effects fire only on
 * the first-seen delivery.
 *
 * Server-only: written by the trusted webhook handler. RLS is ON with no policy
 * in prod-setup.sql (service role bypasses RLS), so it is not reachable over the
 * REST API. No FK to auth.users — keyed solely by Stripe's event id.
 */
export const stripeWebhookEvents = vtSaasSchema.table(
  'stripe_webhook_events',
  {
    // Stripe's `event.id` (e.g. "evt_..."), globally unique — used as the PK so a
    // retried delivery conflicts on insert.
    eventId: text('event_id').primaryKey(),
    eventType: text('event_type').notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow().notNull(),
  },
);

export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect;
export type InsertStripeWebhookEvent = typeof stripeWebhookEvents.$inferInsert;
