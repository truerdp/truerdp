CREATE TABLE IF NOT EXISTS "impersonation_sessions" (
  "id" serial PRIMARY KEY NOT NULL,
  "token" text NOT NULL,
  "admin_user_id" integer NOT NULL,
  "target_user_id" integer NOT NULL,
  "mode" text DEFAULT 'full' NOT NULL,
  "reason" text NOT NULL,
  "started_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp NOT NULL,
  "ended_at" timestamp,
  "ended_reason" text,
  "last_seen_at" timestamp,
  "ip_address" text,
  "user_agent" text
);
--> statement-breakpoint
ALTER TABLE "impersonation_sessions"
  ADD CONSTRAINT "impersonation_sessions_admin_user_id_users_id_fk"
  FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "impersonation_sessions"
  ADD CONSTRAINT "impersonation_sessions_target_user_id_users_id_fk"
  FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "impersonation_sessions_token_unique"
  ON "impersonation_sessions" USING btree ("token");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "impersonation_sessions_admin_user_id_idx"
  ON "impersonation_sessions" USING btree ("admin_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "impersonation_sessions_target_user_id_idx"
  ON "impersonation_sessions" USING btree ("target_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "impersonation_sessions_active_lookup_idx"
  ON "impersonation_sessions" USING btree ("token","ended_at","expires_at");
