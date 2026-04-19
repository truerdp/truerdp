CREATE TABLE IF NOT EXISTS "instance_extensions" (
  "id" serial PRIMARY KEY NOT NULL,
  "instance_id" integer NOT NULL,
  "extended_by_user_id" integer NOT NULL,
  "previous_expiry_date" timestamp NOT NULL,
  "new_expiry_date" timestamp NOT NULL,
  "days_extended" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "instance_extensions"
  ADD CONSTRAINT "instance_extensions_instance_id_instances_id_fk"
  FOREIGN KEY ("instance_id") REFERENCES "instances"("id");

ALTER TABLE "instance_extensions"
  ADD CONSTRAINT "instance_extensions_extended_by_user_id_users_id_fk"
  FOREIGN KEY ("extended_by_user_id") REFERENCES "users"("id");

CREATE INDEX IF NOT EXISTS "instance_extensions_instance_id_idx" ON "instance_extensions" ("instance_id");
CREATE INDEX IF NOT EXISTS "instance_extensions_extended_by_user_id_idx" ON "instance_extensions" ("extended_by_user_id");
CREATE INDEX IF NOT EXISTS "instance_extensions_created_at_idx" ON "instance_extensions" ("created_at");
