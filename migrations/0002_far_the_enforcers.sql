CREATE TYPE "public"."scheduled_task_status" AS ENUM('scheduled', 'claimed', 'running', 'done', 'failed', 'blocked');--> statement-breakpoint
CREATE TABLE "vt_saas"."scheduled_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "scheduled_task_status" DEFAULT 'scheduled' NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"blocked_reason" text,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_scheduled_tasks_user_id" ON "vt_saas"."scheduled_tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_scheduled_tasks_due" ON "vt_saas"."scheduled_tasks" USING btree ("status","scheduled_at") WHERE status = 'scheduled';