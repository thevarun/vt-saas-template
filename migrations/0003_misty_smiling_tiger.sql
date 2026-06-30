CREATE TABLE "vt_saas"."resource_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"resource_type" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"premium_units_used" bigint DEFAULT 0 NOT NULL,
	"fallback_units_used" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resource_usage_user_resource_period_unique" UNIQUE("user_id","resource_type","period_start")
);
--> statement-breakpoint
CREATE TABLE "vt_saas"."subscription_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"price_cents" integer,
	"stripe_price_id_monthly" text,
	"stripe_price_id_yearly" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_tiers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "vt_saas"."tier_quotas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tier_id" uuid NOT NULL,
	"resource_type" text NOT NULL,
	"premium_unit_key" text,
	"premium_period_limit" bigint DEFAULT 0 NOT NULL,
	"fallback_unit_key" text NOT NULL,
	"fallback_period_limit" bigint NOT NULL,
	"warning_threshold_pct" integer DEFAULT 90 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tier_quotas_tier_resource_unique" UNIQUE("tier_id","resource_type")
);
--> statement-breakpoint
CREATE TABLE "vt_saas"."user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tier_id" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"billing_interval" text,
	"has_trialed" boolean DEFAULT false NOT NULL,
	"trial_expires_at" timestamp with time zone,
	"stripe_subscription_id" text,
	"stripe_customer_id" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"current_period_anchor_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"last_trial_warning_sent_at" timestamp with time zone,
	"last_promotion_warning_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "vt_saas"."tier_quotas" ADD CONSTRAINT "tier_quotas_tier_id_subscription_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "vt_saas"."subscription_tiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vt_saas"."user_subscriptions" ADD CONSTRAINT "user_subscriptions_tier_id_subscription_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "vt_saas"."subscription_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_resource_usage_user_id" ON "vt_saas"."resource_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_resource_usage_user_resource_period" ON "vt_saas"."resource_usage" USING btree ("user_id","resource_type","period_start");--> statement-breakpoint
CREATE INDEX "idx_subscription_tiers_sort_order" ON "vt_saas"."subscription_tiers" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "idx_tier_quotas_tier_id" ON "vt_saas"."tier_quotas" USING btree ("tier_id");--> statement-breakpoint
CREATE INDEX "idx_tier_quotas_tier_resource" ON "vt_saas"."tier_quotas" USING btree ("tier_id","resource_type");--> statement-breakpoint
CREATE INDEX "idx_user_subscriptions_user_id" ON "vt_saas"."user_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_subscriptions_tier_id" ON "vt_saas"."user_subscriptions" USING btree ("tier_id");--> statement-breakpoint
CREATE INDEX "idx_user_subscriptions_status" ON "vt_saas"."user_subscriptions" USING btree ("status");