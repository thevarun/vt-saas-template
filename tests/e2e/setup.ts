/**
 * Playwright global setup
 * Creates test account using Supabase standard signUp (no admin API needed)
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
  (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  && fs.existsSync(envFile)
) {
  dotenv.config({ path: envFile });
}

async function globalSetup(_config: FullConfig) {
  // Create Supabase client using test project credentials
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Test account credentials (stored in process.env for use in tests)
  const TEST_EMAIL = `e2e-test-${Date.now()}@vt-saas-template.test`;
  const TEST_PASSWORD = 'TestPassword123!';

  // Store credentials in env for access in tests
  process.env.TEST_USER_EMAIL = TEST_EMAIL;
  process.env.TEST_USER_PASSWORD = TEST_PASSWORD;

  try {
    // Create test account using standard signUp
    // Note: Test Supabase project must have email verification disabled
    const { data, error } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: {
        // Skip email verification (test project configured for this)
        emailRedirectTo: undefined,
      },
    });

    if (error) {
      console.error('Failed to create test account:', error.message);
      throw error;
    }

    if (!data.user) {
      throw new Error('Test account created but no user returned');
    }

    // eslint-disable-next-line no-console
    console.log(`✅ Test account created: ${TEST_EMAIL}`);
    // eslint-disable-next-line no-console
    console.log(`   User ID: ${data.user.id}`);

    // Store user ID for cleanup in teardown
    process.env.TEST_USER_ID = data.user.id;
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
}

export default globalSetup;
