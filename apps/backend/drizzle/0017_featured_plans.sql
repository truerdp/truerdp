ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "is_featured" boolean DEFAULT false NOT NULL;
