CREATE TABLE IF NOT EXISTS "cart_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "plan_id" integer NOT NULL,
  "plan_pricing_id" integer NOT NULL,
  "quantity" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "order_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_id" integer NOT NULL,
  "plan_id" integer NOT NULL,
  "plan_pricing_id" integer NOT NULL,
  "plan_name" text NOT NULL,
  "plan_price" integer NOT NULL,
  "duration_days" integer NOT NULL,
  "quantity" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_plan_id_plans_id_fk"
    FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_plan_pricing_id_plan_pricing_id_fk"
    FOREIGN KEY ("plan_pricing_id") REFERENCES "plan_pricing"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "order_items" ADD CONSTRAINT "order_items_plan_id_plans_id_fk"
    FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "order_items" ADD CONSTRAINT "order_items_plan_pricing_id_plan_pricing_id_fk"
    FOREIGN KEY ("plan_pricing_id") REFERENCES "plan_pricing"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "cart_items_user_id_idx" ON "cart_items" ("user_id");
CREATE INDEX IF NOT EXISTS "cart_items_plan_pricing_id_idx" ON "cart_items" ("plan_pricing_id");
CREATE UNIQUE INDEX IF NOT EXISTS "cart_items_user_pricing_unique" ON "cart_items" ("user_id", "plan_pricing_id");
CREATE INDEX IF NOT EXISTS "order_items_order_id_idx" ON "order_items" ("order_id");
CREATE INDEX IF NOT EXISTS "order_items_plan_pricing_id_idx" ON "order_items" ("plan_pricing_id");
