-- T-008: Fix Data Layer Integrity Issues
-- F-072: Add FK constraints on memory tables
-- F-079: Remove redundant btree indexes

-- Add FK: mem0_memories.conversation_id -> vercel_conversations.id (on delete set null)
ALTER TABLE "vt_saas"."mem0_memories" ADD CONSTRAINT "mem0_memories_conversation_id_vercel_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "vt_saas"."vercel_conversations"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
-- Add FK: memory_extraction_jobs.conversation_id -> vercel_conversations.id (on delete cascade)
ALTER TABLE "vt_saas"."memory_extraction_jobs" ADD CONSTRAINT "memory_extraction_jobs_conversation_id_vercel_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "vt_saas"."vercel_conversations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- Remove redundant index on shareable_links.token (UNIQUE constraint already creates btree index)
DROP INDEX IF EXISTS "idx_shareable_links_token";
--> statement-breakpoint
-- Remove redundant index on threads.conversation_id (UNIQUE constraint already creates btree index)
DROP INDEX IF EXISTS "idx_threads_conversation_id";
