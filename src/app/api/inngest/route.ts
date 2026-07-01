import { serve } from 'inngest/next';

import { inngest } from '@/libs/inngest/client';
import { forceExpireTrialsAndPromotionsFunction } from '@/libs/inngest/functions/force-expire-trials-and-promotions';
import {
  processSingleTask,
  scheduledTasksCron,
} from '@/libs/inngest/functions/scheduled-tasks';
import { tokenRefreshFunction } from '@/libs/inngest/functions/token-refresh';
import { trialPromotionExpiryWarningsFunction } from '@/libs/inngest/functions/trial-promotion-expiry-warnings';

// Register functions in production (real cloud env) and local dev (Inngest Dev
// Server CLI on port 8288). Preview/branch deploys on Vercel have
// NODE_ENV=production but VERCEL_ENV=preview, so they stay empty — otherwise each
// preview would spawn its own Inngest branch environment and run crons independently.
//
// The reverse-trial crons are always registered but no-op internally when
// ENABLE_REVERSE_TRIAL is off (so toggling the policy needs no redeploy of this
// route).
const shouldRegister
  = process.env.VERCEL_ENV === 'production'
    || process.env.NODE_ENV === 'development';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: shouldRegister
    ? [
        scheduledTasksCron,
        processSingleTask,
        forceExpireTrialsAndPromotionsFunction,
        trialPromotionExpiryWarningsFunction,
        tokenRefreshFunction,
      ]
    : [],
});
