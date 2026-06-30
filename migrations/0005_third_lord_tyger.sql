ALTER TABLE "vt_saas"."stripe_webhook_events" ALTER COLUMN "processed_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "vt_saas"."stripe_webhook_events" ALTER COLUMN "processed_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "vt_saas"."stripe_webhook_events" ADD COLUMN "received_at" timestamp with time zone DEFAULT now() NOT NULL;