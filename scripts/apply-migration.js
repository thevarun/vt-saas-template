/**
 * Script to apply complete migration including RLS policies
 * Run: node scripts/apply-migration.js
 */

const fs = require('node:fs');
const path = require('node:path');
// Load DATABASE_URL from environment
const dotenv = require('dotenv');

const { Pool } = require('pg');

const envPath = path.join(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment');
  console.error('Please set DATABASE_URL in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('supabase') ? { rejectUnauthorized: false } : false,
});

async function applyMigration() {
  console.log('🚀 Applying complete migration with RLS policies...\n');

  const migrationPath = path.join(__dirname, '../migrations/complete-migration-with-rls.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  const client = await pool.connect();
  try {
    // Split into statements and execute
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.toLowerCase().startsWith('select')) {
        // Skip verification queries
        continue;
      }

      try {
        console.log(`📝 Executing: ${statement.substring(0, 60).replace(/\n/g, ' ')}...`);
        await client.query(statement);
        console.log('✅ Success\n');
      } catch (err) {
        // Ignore "already exists" errors
        if (err.message.includes('already exists')) {
          console.log('⚠️  Already exists, skipping\n');
        } else {
          console.error(`❌ Error: ${err.message}\n`);
          throw err;
        }
      }
    }

    console.log('✅ Migration applied successfully!');
    console.log('\n📊 Verifying RLS policies...');

    const { rows } = await client.query(`
      SELECT policyname, cmd, qual
      FROM pg_policies
      WHERE schemaname = 'health_companion' AND tablename = 'threads'
    `);

    console.log(`\n✅ Found ${rows.length} RLS policies:`);
    rows.forEach((row) => {
      console.log(`  - ${row.policyname} (${row.cmd})`);
    });
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
