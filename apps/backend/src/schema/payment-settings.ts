import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const paymentSettings = pgTable("payment_settings", {
  id: integer("id").primaryKey().default(1),
  upiEnabled: boolean("upi_enabled").default(false).notNull(),
  usdtTrc20Enabled: boolean("usdt_trc20_enabled").default(true).notNull(),
  dodoCheckoutEnabled: boolean("dodo_checkout_enabled").default(true).notNull(),
  coingateCheckoutEnabled: boolean("coingate_checkout_enabled")
    .default(true)
    .notNull(),
  paypalCheckoutEnabled: boolean("paypal_checkout_enabled")
    .default(true)
    .notNull(),
  usdtTrc20WalletAddress: text("usdt_trc20_wallet_address"),
  usdtTrc20QrCodeImageUrl: text("usdt_trc20_qr_code_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date())
    .notNull(),
})
