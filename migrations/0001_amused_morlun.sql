CREATE TABLE "vt_saas"."platform_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"access_token" text NOT NULL,
	"encryption_key_version" smallint DEFAULT 1 NOT NULL,
	"refresh_token" text,
	"token_expires_at" timestamp with time zone,
	"provider_account_id" text NOT NULL,
	"username" text NOT NULL,
	"display_name" text,
	"profile_picture_url" text,
	"scope" text,
	"status" text DEFAULT 'connected' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_platform_connections_user_provider" UNIQUE("user_id","provider")
);
--> statement-breakpoint
CREATE INDEX "idx_platform_connections_user_id" ON "vt_saas"."platform_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_platform_connections_token_expires_at" ON "vt_saas"."platform_connections" USING btree ("token_expires_at") WHERE token_expires_at IS NOT NULL;