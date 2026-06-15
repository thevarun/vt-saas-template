/**
 * Pure CTA-mapping logic for the subscriptions tier grid.
 *
 * Product-agnostic and fully unit-tested: given the user's current tier and a
 * card's tier, decide the button label/variant. Kept out of the client
 * component so it can be tested without React/Server-Action imports.
 *
 * `variant` is a label the consuming component maps to a button variant — note
 * 'destructive-outline' is a semantic intent (a downgrade), not a built-in
 * shadcn variant; map it to `outline` + a destructive text colour, or add a
 * variant.
 */

/** Tier ordering for comparison: lower index = lower tier. */
export const TIER_ORDER = ['free', 'pro'] as const;

export type CtaConfig = {
  label: string;
  variant: 'default' | 'outline' | 'destructive-outline';
  isCurrentPlan: boolean;
  /** Non-actionable card (rendered, but the button is disabled). */
  disabled?: boolean;
};

function displayName(tierName: string): string {
  return tierName.charAt(0).toUpperCase() + tierName.slice(1);
}

/**
 * Decide the CTA label/variant for a tier card, given the user's current tier.
 *
 * Promotion users get paid-equivalent access for free until the grant expires.
 * They sit above free and below paid: surface an upgrade path to the paid tier
 * (so they can lock in paid access before the promo ends), and render free as a
 * non-actionable fallback rather than a real "downgrade" — promotion users have
 * no Stripe customer, so the billing-portal downgrade flow doesn't apply.
 */
export function getCtaConfig(userTierName: string, cardTierName: string): CtaConfig {
  if (userTierName === cardTierName) {
    return { label: 'Current Plan', variant: 'default', isCurrentPlan: true };
  }

  if (userTierName === 'promotion') {
    if (cardTierName === 'free') {
      return { label: 'Free plan', variant: 'outline', isCurrentPlan: false, disabled: true };
    }
    return { label: `Upgrade to ${displayName(cardTierName)}`, variant: 'default', isCurrentPlan: false };
  }

  const userIndex = TIER_ORDER.indexOf(userTierName as typeof TIER_ORDER[number]);
  const cardIndex = TIER_ORDER.indexOf(cardTierName as typeof TIER_ORDER[number]);

  if (cardIndex > userIndex) {
    return { label: `Upgrade to ${displayName(cardTierName)}`, variant: 'default', isCurrentPlan: false };
  }

  // Downgrade
  if (cardTierName === 'free') {
    return { label: 'Downgrade', variant: 'destructive-outline', isCurrentPlan: false };
  }
  return { label: `Downgrade to ${displayName(cardTierName)}`, variant: 'destructive-outline', isCurrentPlan: false };
}
