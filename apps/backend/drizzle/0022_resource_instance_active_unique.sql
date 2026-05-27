DROP INDEX IF EXISTS "resources_instance_id_unique";
CREATE UNIQUE INDEX "resources_instance_id_unique" ON "resources" USING btree ("instance_id") WHERE "resources"."status" = 'active';
