ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "renewal_instance_id" integer;

CREATE INDEX IF NOT EXISTS "orders_renewal_instance_id_idx"
  ON "orders" ("renewal_instance_id");
