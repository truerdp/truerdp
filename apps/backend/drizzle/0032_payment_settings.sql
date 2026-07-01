CREATE TABLE IF NOT EXISTS "payment_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"upi_enabled" boolean DEFAULT false NOT NULL,
	"usdt_trc20_enabled" boolean DEFAULT true NOT NULL,
	"dodo_checkout_enabled" boolean DEFAULT true NOT NULL,
	"coingate_checkout_enabled" boolean DEFAULT true NOT NULL,
	"paypal_checkout_enabled" boolean DEFAULT true NOT NULL,
	"usdt_trc20_wallet_address" text,
	"usdt_trc20_qr_code_image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "payment_settings" (
	"id",
	"upi_enabled",
	"usdt_trc20_enabled",
	"dodo_checkout_enabled",
	"coingate_checkout_enabled",
	"paypal_checkout_enabled",
	"usdt_trc20_wallet_address",
	"usdt_trc20_qr_code_image_url"
)
VALUES (
	1,
	false,
	true,
	true,
	true,
	true,
	'TUE67fuWyc4XLMeDFpywCgZuoNcdmSAfE2',
	'/payment/usdt-qr.png'
)
ON CONFLICT ("id") DO NOTHING;
