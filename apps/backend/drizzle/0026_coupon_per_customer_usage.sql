ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "max_uses_per_customer" integer DEFAULT 1;
--> statement-breakpoint
DROP INDEX IF EXISTS "coupon_usages_coupon_user_unique";
