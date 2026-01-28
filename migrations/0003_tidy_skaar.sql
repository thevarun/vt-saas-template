CREATE TABLE "health_companion"."user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"username" text,
	"display_name" text,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "user_preferences_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE INDEX "idx_user_preferences_user_id" ON "health_companion"."user_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_preferences_username" ON "health_companion"."user_preferences" USING btree ("username");--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN "email_notifications";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN "language";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN "onboarding_completed_at";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN "onboarding_step";