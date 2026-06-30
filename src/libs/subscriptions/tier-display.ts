/**
 * Display-only tier constants — the SHAPE, not real product copy.
 *
 * This is a documented placeholder so the subscription UI's imports resolve.
 * Each product REPLACES these values with its own pricing + feature copy.
 *
 * Prices here are DISPLAY-ONLY: the actual charge always uses the Stripe price id
 * resolved server-side (see `subscription_tiers.stripe_price_id_*` and
 * `createCheckoutSession`). Keeping a price constant here just lets the pricing
 * grid render a number without an extra round-trip.
 */

export const PRO_MONTHLY_PRICE_CENTS = 0;
export const PRO_YEARLY_PRICE_CENTS = 0;

export const PRO_FEATURES = [
  'Feature one',
  'Feature two',
  'Feature three',
] as const;
