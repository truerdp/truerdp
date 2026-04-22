ALTER TABLE "plan_pricing"
ADD COLUMN IF NOT EXISTS "dodo_product_id" text;

ALTER TABLE "plan_pricing"
ADD COLUMN IF NOT EXISTS "dodo_sync_status" text DEFAULT 'pending' NOT NULL;

ALTER TABLE "plan_pricing"
ADD COLUMN IF NOT EXISTS "dodo_sync_error" text;

ALTER TABLE "plan_pricing"
ADD COLUMN IF NOT EXISTS "dodo_synced_at" timestamp;
