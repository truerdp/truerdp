-- Create new enums
CREATE TYPE "public"."purchase_kind" AS ENUM('new_purchase', 'renewal');--> statement-breakpoint
CREATE TYPE "public"."resource_status" AS ENUM('creating', 'running', 'stopped', 'failed', 'deleted');--> statement-breakpoint

-- Add new columns to instances table
ALTER TABLE "instances" ADD COLUMN "origin_order_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "instances" ADD COLUMN "provision_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "instances" ADD COLUMN "last_provision_error" text;--> statement-breakpoint

-- Add foreign key constraint for origin_order_id
ALTER TABLE "instances" ADD CONSTRAINT "instances_origin_order_id_orders_id_fk" FOREIGN KEY ("origin_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- Create index for origin_order_id
CREATE INDEX "instances_origin_order_id_idx" ON "instances" USING btree ("origin_order_id");--> statement-breakpoint

-- Drop foreign key from instances to servers
ALTER TABLE "instances" DROP CONSTRAINT "instances_server_id_servers_id_fk";--> statement-breakpoint

-- Drop server_id column from instances
ALTER TABLE "instances" DROP COLUMN "server_id";--> statement-breakpoint

-- Add new columns to servers table (before renaming)
ALTER TABLE "servers" ADD COLUMN "instance_id" integer;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "provider" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "last_synced_at" timestamp;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "health_status" text;--> statement-breakpoint

-- Rename columns in servers table
ALTER TABLE "servers" RENAME COLUMN "password" TO "password_encrypted";--> statement-breakpoint

-- Drop old columns from servers table (cpu, ram, storage are no longer needed)
ALTER TABLE "servers" DROP COLUMN "cpu";--> statement-breakpoint
ALTER TABLE "servers" DROP COLUMN "ram";--> statement-breakpoint
ALTER TABLE "servers" DROP COLUMN "storage";--> statement-breakpoint

-- Drop old status unique constraint
ALTER TABLE "servers" DROP CONSTRAINT "servers_ip_address_unique";--> statement-breakpoint

-- Rename servers table to resources
ALTER TABLE "servers" RENAME TO "resources";--> statement-breakpoint

-- Add new constraints to resources table
ALTER TABLE "resources" ADD CONSTRAINT "resources_instance_id_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- Create new unique indexes for resources table
CREATE UNIQUE INDEX "resources_instance_id_unique" ON "resources" USING btree ("instance_id");--> statement-breakpoint
CREATE UNIQUE INDEX "resources_provider_external_id_unique" ON "resources" USING btree ("provider", "external_id");--> statement-breakpoint
CREATE INDEX "resources_status_idx" ON "resources" USING btree ("status");--> statement-breakpoint

-- Add the purchase_kind column to orders table
ALTER TABLE "orders" ADD COLUMN "kind" "purchase_kind" DEFAULT 'new_purchase' NOT NULL;--> statement-breakpoint

-- Create index for orders.kind
CREATE INDEX "orders_kind_idx" ON "orders" USING btree ("kind");--> statement-breakpoint
