CREATE TABLE "health_companion"."shareable_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"expires_at" timestamp with time zone,
	"access_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shareable_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE INDEX "idx_shareable_links_token" ON "health_companion"."shareable_links" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_shareable_links_created_by" ON "health_companion"."shareable_links" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_shareable_links_resource" ON "health_companion"."shareable_links" USING btree ("resource_type","resource_id");