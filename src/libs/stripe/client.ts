import Stripe from 'stripe';

import { Env } from '@/libs/Env';

// Lazy singleton — avoids a build-time crash when STRIPE_SECRET_KEY is unset
// (e.g. CI, or a fork that hasn't enabled billing). Mirrors the cached-singleton
// + Env pattern used by src/libs/supabase/admin.ts.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = Env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    _stripe = new Stripe(key, {
      // Pinned to the API version this SDK ships with. Bump it (and re-test the
      // webhook) when you upgrade the `stripe` package across a major API change.
      apiVersion: '2026-05-27.dahlia',
      typescript: true,
    });
  }
  return _stripe;
}
