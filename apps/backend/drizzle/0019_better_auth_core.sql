ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "image" text;

UPDATE "users"
SET "name" = NULLIF(trim(concat_ws(' ', "first_name", "last_name")), '')
WHERE "name" IS NULL OR trim("name") = '';

UPDATE "users"
SET "name" = 'User'
WHERE "name" IS NULL OR trim("name") = '';

ALTER TABLE "users" ALTER COLUMN "name" SET DEFAULT 'User';
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "account" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamp,
  "refresh_token_expires_at" timestamp,
  "scope" text,
  "password" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" serial PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "account_provider_account_unique" ON "account" ("provider_id", "account_id");

CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "session_token_unique" ON "session" ("token");

CREATE UNIQUE INDEX IF NOT EXISTS "verification_identifier_value_unique" ON "verification" ("identifier", "value");
CREATE INDEX IF NOT EXISTS "verification_expires_at_idx" ON "verification" ("expires_at");

INSERT INTO "account" (
  "user_id",
  "account_id",
  "provider_id",
  "password",
  "created_at",
  "updated_at"
)
SELECT
  "users"."id",
  "users"."id"::text,
  'credential',
  "users"."password_hash",
  now(),
  now()
FROM "users"
LEFT JOIN "account" ON
  "account"."provider_id" = 'credential'
  AND "account"."account_id" = "users"."id"::text
WHERE "account"."id" IS NULL;
