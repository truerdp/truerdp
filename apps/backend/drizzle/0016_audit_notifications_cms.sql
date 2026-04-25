CREATE TABLE "cms_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"subject_template" text NOT NULL,
	"html_template" text NOT NULL,
	"text_template" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_user_id" integer,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer,
	"reason" text NOT NULL,
	"before_state" jsonb,
	"after_state" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX "cms_pages_slug_unique" ON "cms_pages" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX "cms_pages_is_published_idx" ON "cms_pages" USING btree ("is_published");
--> statement-breakpoint
CREATE INDEX "cms_pages_updated_at_idx" ON "cms_pages" USING btree ("updated_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "email_templates_key_unique" ON "email_templates" USING btree ("key");
--> statement-breakpoint
CREATE INDEX "email_templates_is_active_idx" ON "email_templates" USING btree ("is_active");
--> statement-breakpoint
CREATE INDEX "admin_audit_logs_admin_user_id_idx" ON "admin_audit_logs" USING btree ("admin_user_id");
--> statement-breakpoint
CREATE INDEX "admin_audit_logs_entity_idx" ON "admin_audit_logs" USING btree ("entity_type","entity_id");
--> statement-breakpoint
CREATE INDEX "admin_audit_logs_action_idx" ON "admin_audit_logs" USING btree ("action");
--> statement-breakpoint
CREATE INDEX "admin_audit_logs_created_at_idx" ON "admin_audit_logs" USING btree ("created_at");
--> statement-breakpoint
INSERT INTO "cms_pages" ("slug", "title", "summary", "content", "seo_title", "seo_description", "is_published", "published_at")
VALUES
	('homepage', 'TrueRDP Plans', 'Browse plans and start checkout.', '{"hero":{"badge":"Instant setup workflow","headline":"Choose a TrueRDP plan and start your order in minutes","description":"Select duration, pick a payment method, and generate a transaction. Provisioning is handled by admin confirmation in the current flow."},"sections":{"planGroupsTitle":"Plans by Type","planLocationsTitle":"Plans by Location","comparisonTitle":"Plan comparison","comparisonDescription":"Use this matrix to compare plan resources and locations before checkout."},"footerLinks":[{"label":"FAQ","href":"/faq"},{"label":"Terms","href":"/terms"},{"label":"Privacy","href":"/privacy"},{"label":"Refund Policy","href":"/refund-policy"},{"label":"Contact & Support","href":"/contact"}]}'::jsonb, 'TrueRDP Plans', 'Browse TrueRDP hosting plans, compare pricing, and start checkout instantly.', true, now()),
	('faq', 'Frequently Asked Questions', 'Common answers about plans, payments, and provisioning.', '{"items":[{"question":"How quickly are instances provisioned?","answer":"After payment confirmation, admin provisions and assigns a server. Provisioning time depends on queue and inventory."},{"question":"Can I renew before expiry?","answer":"Yes. Renewals extend your expiry date. Suspended instances must be unsuspended before renewal."},{"question":"Which payment methods are available?","answer":"Available methods include UPI, USDT TRC20, Dodo checkout, and CoinGate checkout based on configuration."}]}'::jsonb, 'FAQ | TrueRDP', 'Answers to common questions about plans, billing, and provisioning.', true, now()),
	('terms', 'Terms of Service', 'Terms and conditions for using TrueRDP.', '{"sections":[{"heading":"Service usage","body":"You agree to use the service lawfully and in accordance with acceptable use requirements."},{"heading":"Billing","body":"Orders are billed according to selected plan pricing and duration."},{"heading":"Suspension and termination","body":"Admins may suspend or terminate instances in accordance with policy and operational requirements."}]}'::jsonb, 'Terms of Service | TrueRDP', 'Terms and conditions for TrueRDP services.', true, now()),
	('privacy', 'Privacy Policy', 'How TrueRDP handles personal data.', '{"sections":[{"heading":"Data collected","body":"We collect account, billing, and operational data needed to provide the service."},{"heading":"Data usage","body":"Data is used for account management, provisioning, support, and security."},{"heading":"Retention","body":"Data is retained according to legal and operational requirements."}]}'::jsonb, 'Privacy Policy | TrueRDP', 'How TrueRDP collects, uses, and protects data.', true, now()),
	('refund-policy', 'Refund Policy', 'Refund terms for purchases and renewals.', '{"sections":[{"heading":"Eligibility","body":"Refund eligibility depends on service usage and timing from purchase."},{"heading":"Review","body":"Requests are reviewed case-by-case by support and admin."},{"heading":"Timeline","body":"Approved refunds are processed to the original payment method where possible."}]}'::jsonb, 'Refund Policy | TrueRDP', 'Refund terms for TrueRDP plans and renewals.', true, now()),
	('contact', 'Contact & Support', 'Ways to reach support and open tickets.', '{"sections":[{"heading":"Support tickets","body":"Open a ticket from your dashboard support page for issue tracking."},{"heading":"Response windows","body":"Our team responds based on queue priority and operational impact."},{"heading":"Account help","body":"For login and billing issues, include your invoice or transaction reference for faster resolution."}]}'::jsonb, 'Contact & Support | TrueRDP', 'Reach TrueRDP support and get help with billing or provisioning.', true, now())
ON CONFLICT ("slug") DO NOTHING;
