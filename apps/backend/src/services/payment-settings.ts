import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db.js"
import { paymentSettings } from "../schema.js"
import type { SupportedPaymentMethod } from "./billing.js"

const SINGLETON_ID = 1

const emptyStringToNullSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => {
    if (value == null) {
      return null
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  })

export const paymentSettingsInputSchema = z
  .object({
    upiEnabled: z.boolean().default(false),
    usdtTrc20Enabled: z.boolean().default(true),
    dodoCheckoutEnabled: z.boolean().default(true),
    coingateCheckoutEnabled: z.boolean().default(true),
    paypalCheckoutEnabled: z.boolean().default(true),
    usdtTrc20WalletAddress: emptyStringToNullSchema,
    usdtTrc20QrCodeImageUrl: emptyStringToNullSchema,
  })
  .superRefine((value, ctx) => {
    if (!value.usdtTrc20Enabled) {
      return
    }

    if (!value.usdtTrc20WalletAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "TRC20 wallet address is required when USDT TRC20 is enabled",
        path: ["usdtTrc20WalletAddress"],
      })
    }

    if (!value.usdtTrc20QrCodeImageUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "TRC20 QR code image URL is required when USDT TRC20 is enabled",
        path: ["usdtTrc20QrCodeImageUrl"],
      })
    }
  })

export type PaymentSettingsInput = z.infer<typeof paymentSettingsInputSchema>

export const defaultPaymentSettings: PaymentSettingsInput = {
  upiEnabled: false,
  usdtTrc20Enabled: true,
  dodoCheckoutEnabled: true,
  coingateCheckoutEnabled: true,
  paypalCheckoutEnabled: true,
  usdtTrc20WalletAddress: "TUE67fuWyc4XLMeDFpywCgZuoNcdmSAfE2",
  usdtTrc20QrCodeImageUrl: "/payment/usdt-qr.png",
}

export type PaymentSettingsRecord = PaymentSettingsInput & {
  id: number
  createdAt: Date
  updatedAt: Date
}

export function getEnabledPaymentMethods(
  settings: PaymentSettingsInput
): SupportedPaymentMethod[] {
  return [
    settings.upiEnabled ? "upi" : null,
    settings.usdtTrc20Enabled ? "usdt_trc20" : null,
    settings.dodoCheckoutEnabled ? "dodo_checkout" : null,
    settings.coingateCheckoutEnabled ? "coingate_checkout" : null,
    settings.paypalCheckoutEnabled ? "paypal_checkout" : null,
  ].filter((value): value is SupportedPaymentMethod => value != null)
}

export function isPaymentMethodEnabled(
  settings: PaymentSettingsInput,
  method: SupportedPaymentMethod
) {
  switch (method) {
    case "upi":
      return settings.upiEnabled
    case "usdt_trc20":
      return settings.usdtTrc20Enabled
    case "dodo_checkout":
      return settings.dodoCheckoutEnabled
    case "coingate_checkout":
      return settings.coingateCheckoutEnabled
    case "paypal_checkout":
      return settings.paypalCheckoutEnabled
  }
}

export async function getPaymentSettings(): Promise<PaymentSettingsRecord> {
  const [row] = await db
    .select()
    .from(paymentSettings)
    .where(eq(paymentSettings.id, SINGLETON_ID))
    .limit(1)

  if (row) {
    return row
  }

  const [created] = await db
    .insert(paymentSettings)
    .values({
      id: SINGLETON_ID,
      ...defaultPaymentSettings,
    })
    .onConflictDoUpdate({
      target: paymentSettings.id,
      set: {
        ...defaultPaymentSettings,
      },
    })
    .returning()

  if (!created) {
    throw new Error("Failed to initialize payment settings")
  }

  return created
}

export async function updatePaymentSettings(
  input: PaymentSettingsInput
): Promise<PaymentSettingsRecord> {
  const [updated] = await db
    .insert(paymentSettings)
    .values({
      id: SINGLETON_ID,
      ...input,
    })
    .onConflictDoUpdate({
      target: paymentSettings.id,
      set: {
        ...input,
        updatedAt: new Date(),
      },
    })
    .returning()

  if (!updated) {
    throw new Error("Failed to update payment settings")
  }

  return updated
}

export async function getPublicPaymentSettings() {
  const settings = await getPaymentSettings()

  return {
    enabledMethods: getEnabledPaymentMethods(settings),
    methods: {
      upi: { enabled: settings.upiEnabled },
      usdt_trc20: {
        enabled: settings.usdtTrc20Enabled,
        walletAddress: settings.usdtTrc20WalletAddress,
        qrCodeImageUrl: settings.usdtTrc20QrCodeImageUrl,
      },
      dodo_checkout: { enabled: settings.dodoCheckoutEnabled },
      coingate_checkout: { enabled: settings.coingateCheckoutEnabled },
      paypal_checkout: { enabled: settings.paypalCheckoutEnabled },
    },
  }
}
