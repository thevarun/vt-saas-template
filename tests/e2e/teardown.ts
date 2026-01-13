/**
 * Playwright global teardown
 * Deletes test account using Supabase Admin API
 */

import fs from 'node:fs';
import path from 'node:path';

import type { FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Preferred: CI injects Supabase secrets as env vars.
// Local fallback: load .env.local only if values are missing.
const envFile = path.resolve(process.cwd(), '.env.local');
if (
  (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
  && fs.existsSync(envFile)
) {
  dotenv.config({ path: envFile });
}

async function globalTeardown(_config: FullConfig) {
  const testUserId = process.env.TEST_USER_ID;

  if (!testUserId) {
    console.warn('⚠️ No TEST_USER_ID found, skipping cleanup');
    return;
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for E2E test cleanup. '
      + 'Add it to GitHub secrets or .env.local to prevent test account accumulation.',
    );
  }

  // Create Supabase admin client using service role key
  // NOTE: Service role key has admin privileges - only use in tests
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  try {
    // Delete test user using admin API
    const { error } = await supabaseAdmin.auth.admin.deleteUser(testUserId);

    if (error) {
      console.error('Failed to delete test account:', error.message);
      throw error;
    }

    // eslint-disable-next-line no-console
    console.log(`✅ Test account deleted: ${testUserId}`);
  } catch (error) {
    console.error('❌ Teardown failed:', error);
    // Don't throw - we don't want to fail the test run due to cleanup issues
  }
}

export default globalTeardown;
