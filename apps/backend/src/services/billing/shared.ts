import { randomUUID } from "node:crypto"
import { z } from "zod"
import { orders, type OrderBillingDetails } from "../../schema.js"

const PAYMENT_WINDOW_HOURS = 48

export const supportedPaymentMethodSchema = z.enum([
  "upi",
  "usdt_trc20",
  "dodo_checkout",
  "coingate_checkout",
])

export type SupportedPaymentMethod = z.infer<typeof supportedPaymentMethodSchema>
export type BillingDetailsInput = OrderBillingDetails

export class BillingError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message)
    this.name = "BillingError"
  }
}

export function requireInsertedRecord<T>(value: T | undefined, label: string): T {
  if (!value) {
    throw new Error(`Failed to create ${label}`)
  }

  return value
}

export function createInvoiceNumber() {
  return `INV-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`
}

export function createTransactionReference() {
  return `TXN-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`
}

export function createInvoiceExpiry(baseDate = new Date()) {
  const expiresAt = new Date(baseDate)
  expiresAt.setHours(expiresAt.getHours() + PAYMENT_WINDOW_HOURS)
  return expiresAt
}

export function formatEmailAmount(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amountMinor / 100)
}

type LegacyPricedOrderRecord = {
  planPriceUsdCents?: number | null
  planPrice?: number | null
}

export function getOrderPlanPriceUsdCents(order: LegacyPricedOrderRecord) {
  return order.planPriceUsdCents ?? order.planPrice ?? null
}

export function buildOrderPriceInsertValue(planPriceUsdCents: number) {
  if ("planPriceUsdCents" in orders) {
    return {
      planPriceUsdCents,
    } as Record<string, number>
  }

  return {
    planPrice: planPriceUsdCents,
  } as Record<string, number>
}
