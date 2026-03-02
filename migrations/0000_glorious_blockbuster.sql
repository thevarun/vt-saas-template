CREATE SCHEMA "vt_saas";
--> statement-breakpoint
CREATE TYPE "public"."feedback_status" AS ENUM('pending', 'reviewed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."feedback_type" AS ENUM('bug', 'feature', 'praise');--> statement-breakpoint
CREATE TABLE "vt_saas"."admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vt_saas"."feedback" (
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
CREATE TABLE "vt_saas"."mem0_memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"conversation_id" uuid,
	"memory_text" text NOT NULL,
	"memory_type" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vt_saas"."memory_extraction_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"status" text NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "vt_saas"."shareable_links" (
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
CREATE TABLE "vt_saas"."threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"conversation_id" text NOT NULL,
	"title" text,
	"last_message_preview" text,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "threads_conversation_id_unique" UNIQUE("conversation_id")
);
--> statement-breakpoint
CREATE TABLE "vt_saas"."user_preferences" (
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
CREATE TABLE "vt_saas"."vercel_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text,
	"last_message_preview" text,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vt_saas"."vercel_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"token_count" integer,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vt_saas"."mem0_memories" ADD CONSTRAINT "mem0_memories_conversation_id_vercel_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "vt_saas"."vercel_conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vt_saas"."memory_extraction_jobs" ADD CONSTRAINT "memory_extraction_jobs_conversation_id_vercel_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "vt_saas"."vercel_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vt_saas"."vercel_messages" ADD CONSTRAINT "vercel_messages_conversation_id_vercel_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "vt_saas"."vercel_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admin_audit_log_admin_id" ON "vt_saas"."admin_audit_log" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_admin_audit_log_created_at" ON "vt_saas"."admin_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_admin_audit_log_action_created_at" ON "vt_saas"."admin_audit_log" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX "idx_feedback_user_id" ON "vt_saas"."feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_feedback_status" ON "vt_saas"."feedback" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_feedback_created_at" ON "vt_saas"."feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_feedback_status_created" ON "vt_saas"."feedback" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_mem0_memories_user_id" ON "vt_saas"."mem0_memories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_mem0_memories_conversation_id" ON "vt_saas"."mem0_memories" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_memory_jobs_conversation_id" ON "vt_saas"."memory_extraction_jobs" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_memory_jobs_status" ON "vt_saas"."memory_extraction_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_memory_jobs_created_at" ON "vt_saas"."memory_extraction_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_shareable_links_created_by" ON "vt_saas"."shareable_links" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_shareable_links_resource" ON "vt_saas"."shareable_links" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_threads_user_id" ON "vt_saas"."threads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_threads_user_archived" ON "vt_saas"."threads" USING btree ("user_id","archived");--> statement-breakpoint
CREATE INDEX "idx_user_preferences_user_id" ON "vt_saas"."user_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_preferences_username" ON "vt_saas"."user_preferences" USING btree ("username");--> statement-breakpoint
CREATE INDEX "idx_vercel_conversations_user_id" ON "vt_saas"."vercel_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_vercel_conversations_user_archived" ON "vt_saas"."vercel_conversations" USING btree ("user_id","archived");--> statement-breakpoint
CREATE INDEX "idx_vercel_messages_conversation_id" ON "vt_saas"."vercel_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_vercel_messages_created_at" ON "vt_saas"."vercel_messages" USING btree ("created_at");