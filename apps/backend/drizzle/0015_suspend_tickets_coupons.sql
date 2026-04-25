ALTER TYPE "public"."instance_status" ADD VALUE IF NOT EXISTS 'suspended';
--> statement-breakpoint
CREATE TYPE "public"."coupon_applies_to" AS ENUM('all', 'new_purchase', 'renewal');
--> statement-breakpoint
CREATE TYPE "public"."instance_status_action" AS ENUM('provision', 'extend', 'suspend', 'unsuspend', 'terminate');
--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "applies_to" "coupon_applies_to" DEFAULT 'all' NOT NULL;
--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "sender_user_id" integer;
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "instance_status_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "instance_id" integer NOT NULL,
  "admin_user_id" integer NOT NULL,
  "action" "instance_status_action" NOT NULL,
  "reason" text NOT NULL,
  "from_status" "instance_status" NOT NULL,
  "to_status" "instance_status" NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "instance_status_events_instance_id_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."instances"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "instance_status_events_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "instance_status_events_instance_id_idx" ON "instance_status_events" USING btree ("instance_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "instance_status_events_admin_user_id_idx" ON "instance_status_events" USING btree ("admin_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "instance_status_events_created_at_idx" ON "instance_status_events" USING btree ("created_at");
