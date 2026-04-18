-- Create server_status enum type
CREATE TYPE "public"."server_status" AS ENUM('available', 'assigned', 'cleaning', 'retired');

-- Create servers table (inventory layer)
CREATE TABLE IF NOT EXISTS "public"."servers" (
  "id" serial PRIMARY KEY NOT NULL,
  "provider" text DEFAULT 'manual' NOT NULL,
  "external_id" text,
  "ip_address" text NOT NULL,
  "cpu" integer NOT NULL,
  "ram" integer NOT NULL,
  "storage" integer NOT NULL,
  "status" "public"."server_status" DEFAULT 'available' NOT NULL,
  "last_assigned_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes on servers table
CREATE UNIQUE INDEX "servers_ip_address_unique" ON "public"."servers" ("ip_address");
CREATE INDEX "servers_status_idx" ON "public"."servers" ("status");
CREATE INDEX "servers_provider_external_id_idx" ON "public"."servers" ("provider", "external_id");

-- Drop old resource_status enum and recreate with new values
ALTER TYPE "public"."resource_status" RENAME TO "resource_status_old";

CREATE TYPE "public"."resource_status" AS ENUM('active', 'released');

-- Alter resources table: add new columns first
ALTER TABLE "public"."resources" 
  ADD COLUMN "server_id" integer,
  ADD COLUMN "released_at" timestamp,
  ADD COLUMN "assigned_at" timestamp DEFAULT now() NOT NULL;

-- Drop old constraint and index
DROP INDEX IF EXISTS "resources_provider_external_id_unique";
ALTER TABLE "public"."resources" DROP CONSTRAINT IF EXISTS "resources_pkey" CASCADE;
ALTER TABLE "public"."resources" DROP CONSTRAINT IF EXISTS "servers_pkey" CASCADE;

-- Remove old columns (provider, externalId, ipAddress, lastSyncedAt, healthStatus)
ALTER TABLE "public"."resources"
  DROP COLUMN IF EXISTS "provider",
  DROP COLUMN IF EXISTS "external_id",
  DROP COLUMN IF EXISTS "ip_address",
  DROP COLUMN IF EXISTS "last_synced_at",
  DROP COLUMN IF EXISTS "health_status",
  DROP COLUMN IF EXISTS "status";

-- Re-add primary key
ALTER TABLE "public"."resources" ADD PRIMARY KEY ("id");

-- Add status column with new enum
ALTER TABLE "public"."resources" ADD COLUMN "status" "public"."resource_status" DEFAULT 'active' NOT NULL;

-- Add server_id foreign key constraint
ALTER TABLE "public"."resources" ADD CONSTRAINT "resources_server_id_fk" 
  FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE RESTRICT;

-- Drop old unique constraint on server_id if exists, then add it back
DROP INDEX IF EXISTS "resources_instance_id_unique";
CREATE UNIQUE INDEX "resources_instance_id_unique" ON "public"."resources" ("instance_id");
CREATE UNIQUE INDEX "resources_server_id_unique" ON "public"."resources" ("server_id") WHERE "status" = 'active';

-- Add composite index
CREATE INDEX "resources_instance_server_idx" ON "public"."resources" ("instance_id", "server_id");

-- Update status index
DROP INDEX IF EXISTS "resources_status_idx";
CREATE INDEX "resources_status_idx" ON "public"."resources" ("status");

-- Drop old enum
DROP TYPE IF EXISTS "public"."resource_status_old";
