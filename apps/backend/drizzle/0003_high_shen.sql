ALTER TABLE "transactions" ALTER COLUMN "method" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."payment_method";--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('upi', 'usdt_trc20');--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "method" SET DATA TYPE "public"."payment_method" USING "method"::"public"."payment_method";--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "instance_id" integer;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_instance_id_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transactions_instance_id_idx" ON "transactions" USING btree ("instance_id");--> statement-breakpoint
CREATE INDEX "transactions_status_idx" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_reference_unique" ON "transactions" USING btree ("reference");--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_idempotency_key_unique" ON "transactions" USING btree ("idempotency_key");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "discount_percent";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "discount_flat";--> statement-breakpoint
ALTER TABLE "resources" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "resources" ALTER COLUMN "status" TYPE "public"."resource_status" USING (
	CASE "status"::text
		WHEN 'available' THEN 'stopped'
		WHEN 'reserved' THEN 'creating'
		WHEN 'assigned' THEN 'running'
		ELSE 'creating'
	END
)::"public"."resource_status";--> statement-breakpoint
ALTER TABLE "resources" ALTER COLUMN "status" SET DEFAULT 'creating';--> statement-breakpoint
DROP TYPE "public"."server_status";