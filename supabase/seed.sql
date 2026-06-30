-- Seed data
-- Runs after `db:migrate` on a fresh environment, or via `supabase db reset`.
--
-- Keep every insert idempotent with `ON CONFLICT ... DO NOTHING` so the file is
-- safe to re-run.
--
-- ⚠️ EXECUTION ORDER: this file MUST run BEFORE supabase/prod-setup.sql. The
-- reverse-trial signup trigger (in prod-setup.sql, opt-in) RAISEs if the tiers
-- below aren't seeded, and the quota framework's free-tier safety net throws if
-- the 'free' tier + its quota row is missing. See docs/database-workflow.md for
-- the fresh-environment application order.
--
-- See docs/subscriptions.md for the subscription subsystem these rows back.

-- ============================================================
-- Subscription tiers (generic catalogue — replace copy + Stripe ids per product)
-- ============================================================
-- Slugs ('free' / 'pro' / 'promotion') are stable and referenced in code; the
-- display_name / description / price_cents / stripe_price_id_* values are
-- placeholders a product fills in. Prices here are display-only — the real charge
-- uses the Stripe price id resolved server-side.

INSERT INTO "vt_saas"."subscription_tiers"
  (name, display_name, description, price_cents, stripe_price_id_monthly, stripe_price_id_yearly, is_active, sort_order)
VALUES
  ('free',      'Free',      'Starter plan',           0,    NULL, NULL, true, 0),
  ('pro',       'Pro',       'Full-access paid plan',  0,    NULL, NULL, true, 1),
  ('promotion', 'Promotion', 'Admin-granted access',   NULL, NULL, NULL, true, 2)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- Tier quotas (one generic 'generation' resource per tier)
-- ============================================================
-- The two-pool model (premium-then-fallback). Unit keys are opaque labels —
-- a product maps them to whatever it meters (AI model ids, rate-limit buckets).
-- A zero period limit disables a pool for that tier.
--   free:      no premium pool, modest fallback budget
--   pro:       generous premium pool + larger fallback budget
--   promotion: mirrors pro (admin-granted full access)

INSERT INTO "vt_saas"."tier_quotas"
  (tier_id, resource_type, premium_unit_key, premium_period_limit, fallback_unit_key, fallback_period_limit, warning_threshold_pct)
SELECT id, 'generation', NULL, 0, 'fallback', 100, 90
FROM "vt_saas"."subscription_tiers" WHERE name = 'free'
ON CONFLICT (tier_id, resource_type) DO NOTHING;

INSERT INTO "vt_saas"."tier_quotas"
  (tier_id, resource_type, premium_unit_key, premium_period_limit, fallback_unit_key, fallback_period_limit, warning_threshold_pct)
SELECT id, 'generation', 'premium', 1000, 'fallback', 2000, 90
FROM "vt_saas"."subscription_tiers" WHERE name = 'pro'
ON CONFLICT (tier_id, resource_type) DO NOTHING;

INSERT INTO "vt_saas"."tier_quotas"
  (tier_id, resource_type, premium_unit_key, premium_period_limit, fallback_unit_key, fallback_period_limit, warning_threshold_pct)
SELECT id, 'generation', 'premium', 1000, 'fallback', 2000, 90
FROM "vt_saas"."subscription_tiers" WHERE name = 'promotion'
ON CONFLICT (tier_id, resource_type) DO NOTHING;
