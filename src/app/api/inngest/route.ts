import { serve } from 'inngest/next';

import { inngest } from '@/libs/inngest/client';

// Register functions in production (real cloud env) and local dev (Inngest Dev
// Server CLI on port 8288). Preview/branch deploys on Vercel have
// NODE_ENV=production but VERCEL_ENV=preview, so they stay empty — otherwise each
// preview would spawn its own Inngest branch environment and run crons independently.
const shouldRegister
  = process.env.VERCEL_ENV === 'production'
    || process.env.NODE_ENV === 'development';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: shouldRegister ? [] : [],
});
