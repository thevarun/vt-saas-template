CREATE TYPE "public"."feedback_status" AS ENUM('pending', 'reviewed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."feedback_type" AS ENUM('bug', 'feature', 'praise');--> statement-breakpoint
CREATE TABLE "health_companion"."feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message" text NOT NULL,
	"type" "feedback_type" NOT NULL,
	"user_id" uuid,
	"user_email" text,
	"status" "feedback_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "idx_feedback_user_id" ON "health_companion"."feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_feedback_status" ON "health_companion"."feedback" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_feedback_created_at" ON "health_companion"."feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_feedback_status_created" ON "health_companion"."feedback" USING btree ("status","created_at");