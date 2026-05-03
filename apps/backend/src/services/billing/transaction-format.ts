import { invoices, orders, transactions } from "../../schema.js"
import { SupportedPaymentMethod, getOrderPlanPriceUsdCents } from "./shared.js"

export type BillingTransactionRecord = {
  transaction: typeof transactions.$inferSelect
  invoice: typeof invoices.$inferSelect
  order: typeof orders.$inferSelect
  plan: {
    id: number
    name: string
    cpu: number
    ram: number
    storage: number
  }
}

export function formatBillingTransactionResponse(record: BillingTransactionRecord) {
  const planPriceUsdCents = getOrderPlanPriceUsdCents(record.order)

  return {
    id: record.transaction.id,
    userId: record.transaction.userId,
    amount: record.transaction.amount,
    method: record.transaction.method,
    status: record.transaction.status,
    createdAt: record.transaction.createdAt,
    confirmedAt: record.transaction.confirmedAt,
    reference: record.transaction.reference,
    kind: record.order.kind,
    order: {
      id: record.order.id,
      status: record.order.status,
    },
    invoice: {
      id: record.invoice.id,
      invoiceNumber: record.invoice.invoiceNumber,
      status: record.invoice.status,
      totalAmount: record.invoice.totalAmount,
      currency: record.invoice.currency,
      expiresAt: record.invoice.expiresAt,
      paidAt: record.invoice.paidAt,
    },
    plan: {
      id: record.plan.id,
      name: record.plan.name,
      cpu: record.plan.cpu,
      ram: record.plan.ram,
      storage: record.plan.storage,
    },
    pricing: {
      id: record.order.planPricingId,
      durationDays: record.order.durationDays,
      priceUsdCents: planPriceUsdCents,
    },
    instance: record.transaction.instanceId
      ? {
          id: record.transaction.instanceId,
          ipAddress: null,
        }
      : null,
  }
}

export function extractGatewayRedirectUrlFromMetadata(input: {
  method: SupportedPaymentMethod
  metadata: unknown
}) {
  if (!input.metadata || typeof input.metadata !== "object") {
    return null
  }

  const metadata = input.metadata as Record<string, unknown>

  if (input.method === "dodo_checkout") {
    const value = metadata.dodo_checkout_url
    return typeof value === "string" && value.trim().length > 0
      ? value.trim()
      : null
  }

  if (input.method === "coingate_checkout") {
    const value = metadata.coingate_payment_url
    return typeof value === "string" && value.trim().length > 0
      ? value.trim()
      : null
  }

  return null
}
