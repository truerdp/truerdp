ALTER TABLE "plans" ADD COLUMN "cpu_name" text DEFAULT 'Intel Xeon' NOT NULL;
ALTER TABLE "plans" ADD COLUMN "cpu_threads" integer DEFAULT 2 NOT NULL;
ALTER TABLE "plans" ADD COLUMN "ram_type" text DEFAULT 'DDR4' NOT NULL;
ALTER TABLE "plans" ADD COLUMN "storage_type" text DEFAULT 'SSD' NOT NULL;
ALTER TABLE "plans" ADD COLUMN "bandwidth" text DEFAULT '2TB' NOT NULL;
ALTER TABLE "plans" ADD COLUMN "os" text DEFAULT 'Windows' NOT NULL;
ALTER TABLE "plans" ADD COLUMN "os_version" text DEFAULT 'Windows Server 2022' NOT NULL;
ALTER TABLE "plans" ADD COLUMN "plan_type" text DEFAULT 'Dedicated' NOT NULL;
ALTER TABLE "plans" ADD COLUMN "port_speed" text DEFAULT '1Gbps' NOT NULL;
ALTER TABLE "plans" ADD COLUMN "setup_fees" integer DEFAULT 0 NOT NULL;
ALTER TABLE "plans" ADD COLUMN "plan_location" text DEFAULT 'USA' NOT NULL;

CREATE INDEX IF NOT EXISTS "plans_plan_type_idx" ON "plans" ("plan_type");
CREATE INDEX IF NOT EXISTS "plans_plan_location_idx" ON "plans" ("plan_location");
