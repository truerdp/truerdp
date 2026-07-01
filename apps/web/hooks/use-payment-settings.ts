"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api/client"

export type PaymentMethod =
  | "dodo_checkout"
  | "coingate_checkout"
  | "paypal_checkout"
  | "upi"
  | "usdt_trc20"

const paymentMethodValues: PaymentMethod[] = [
  "upi",
  "usdt_trc20",
  "dodo_checkout",
  "coingate_checkout",
  "paypal_checkout",
]

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return (
    typeof value === "string" &&
    paymentMethodValues.includes(value as PaymentMethod)
  )
}

export interface CheckoutPaymentSettings {
  enabledMethods: PaymentMethod[]
  methods: {
    upi: { enabled: boolean }
    usdt_trc20: {
      enabled: boolean
      walletAddress: string | null
      qrCodeImageUrl: string | null
    }
    dodo_checkout: { enabled: boolean }
    coingate_checkout: { enabled: boolean }
    paypal_checkout: { enabled: boolean }
  }
}

function isCheckoutPaymentSettings(
  value: unknown
): value is CheckoutPaymentSettings {
  if (!value || typeof value !== "object") {
    return false
  }

  const settings = value as Partial<CheckoutPaymentSettings>
  return (
    Array.isArray(settings.enabledMethods) &&
    settings.enabledMethods.every(isPaymentMethod) &&
    !!settings.methods &&
    typeof settings.methods === "object" &&
    !!settings.methods.usdt_trc20
  )
}

export function usePaymentSettings() {
  return useQuery<CheckoutPaymentSettings>({
    queryKey: ["payment-settings"],
    queryFn: async () => {
      const settings = await clientApi("/payment-settings")

      if (!isCheckoutPaymentSettings(settings)) {
        throw new Error("Payment settings are unavailable. Please refresh.")
      }

      return settings
    },
    retry: false,
  })
}
