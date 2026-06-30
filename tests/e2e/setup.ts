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
  (!process.env.NEXT_PUBLIC_SUPABASE_URL
    || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  && fs.existsSync(envFile)
) {
  dotenv.config({ path: envFile });
}

const SETUP_TIMEOUT_MS = 15_000; // 15 seconds — fail fast instead of hanging

async function globalSetup(_config: FullConfig) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Early exit when Supabase isn't configured — don't hang the whole CI job
  // (or a local run) on a network call that cannot succeed.
  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      '⚠️  Skipping E2E auth setup: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set.',
    );
    // eslint-disable-next-line no-console -- E2E setup logs test-account lifecycle to the console
    console.log(
      '   Set these env vars or add them to .env.local to run E2E tests.',
    );
    return;
  }

  // Create Supabase client using test project credentials
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test account credentials (stored in process.env for use in tests)
  const TEST_EMAIL = `e2e-test-${Date.now()}@vt-saas-template.test`;
  const TEST_PASSWORD = 'TestPassword123!';

  // Store credentials in env for access in tests
  process.env.TEST_USER_EMAIL = TEST_EMAIL;
  process.env.TEST_USER_PASSWORD = TEST_PASSWORD;

  try {
    // Create test account using standard signUp
    // Note: Test Supabase project must have email verification disabled
    const { data, error } = await Promise.race([
      supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        options: {
          // Skip email verification (test project configured for this)
          emailRedirectTo: undefined,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `Supabase signUp timed out after ${SETUP_TIMEOUT_MS / 1000}s — is Supabase reachable at ${supabaseUrl}?`,
              ),
            ),
          SETUP_TIMEOUT_MS,
        ),
      ),
    ]);

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
