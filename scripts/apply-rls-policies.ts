/**
 * Script to apply RLS policies to Supabase
 * Run: pnpm exec tsx scripts/apply-rls-policies.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyRLSPolicies() {
  console.log('🔒 Applying RLS policies to health_companion.threads...\n');

  // Read RLS policies SQL file
  const rlsPoliciesPath = path.join(__dirname, '../migrations/rls-policies-threads.sql');
  const rlsPoliciesSQL = fs.readFileSync(rlsPoliciesPath, 'utf-8');

  // Split SQL by statement (using -- as separator or statement-breakpoint)
  const statements = rlsPoliciesSQL
    .split(/;/g)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      console.log(`📝 Executing: ${statement.substring(0, 60)}...`);
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        console.error(`❌ Error: ${error.message}`);
      } else {
        console.log('✅ Success\n');
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`❌ Exception: ${error.message}\n`);
    }
  }

  console.log('✅ RLS policies application complete!');
}

applyRLSPolicies().catch((err: unknown) => {
  const error = err as Error;
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
