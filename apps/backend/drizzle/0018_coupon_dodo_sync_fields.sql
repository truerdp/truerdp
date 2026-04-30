ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "dodo_discount_id" text;
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "dodo_sync_status" text DEFAULT 'pending' NOT NULL;
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "dodo_sync_error" text;
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "dodo_synced_at" timestamp;
