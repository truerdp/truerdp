CREATE TABLE "plan_pricing" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"duration_days" integer NOT NULL,
	"price" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "plan_pricing" ("plan_id", "duration_days", "price", "is_active")
SELECT "id", "duration_days", "price", true
FROM "plans";--> statement-breakpoint
INSERT INTO "plan_pricing" ("plan_id", "duration_days", "price", "is_active")
SELECT DISTINCT "plan_id", "duration_days", "plan_price", true
FROM "orders"
WHERE NOT EXISTS (
  SELECT 1
  FROM "plan_pricing"
  WHERE "plan_pricing"."plan_id" = "orders"."plan_id"
    AND "plan_pricing"."duration_days" = "orders"."duration_days"
);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "plan_pricing_id" integer;--> statement-breakpoint
UPDATE "orders"
SET "plan_pricing_id" = "plan_pricing"."id"
FROM "plan_pricing"
WHERE "orders"."plan_pricing_id" IS NULL
  AND "plan_pricing"."plan_id" = "orders"."plan_id"
  AND "plan_pricing"."duration_days" = "orders"."duration_days";--> statement-breakpoint
ALTER TABLE "plan_pricing" ADD CONSTRAINT "plan_pricing_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "plan_pricing_plan_id_idx" ON "plan_pricing" USING btree ("plan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plan_pricing_plan_duration_unique" ON "plan_pricing" USING btree ("plan_id","duration_days");--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "plan_pricing_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_plan_pricing_id_plan_pricing_id_fk" FOREIGN KEY ("plan_pricing_id") REFERENCES "public"."plan_pricing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_plan_pricing_id_idx" ON "orders" USING btree ("plan_pricing_id");--> statement-breakpoint
ALTER TABLE "plans" DROP COLUMN "price";--> statement-breakpoint
ALTER TABLE "plans" DROP COLUMN "duration_days";
