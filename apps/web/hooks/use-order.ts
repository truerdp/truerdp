"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api/client"

export interface OrderBillingDetails {
  firstName: string
  lastName: string
  email: string
  phone: string
  companyName: string | null
  taxId: string | null
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  postalCode: string
  country: string
}

export interface BillingOrder {
  orderId: number
  userId: number
  kind: "new_purchase" | "renewal"
  status: "pending_payment" | "processing" | "completed" | "cancelled"
  createdAt: string
  updatedAt: string
  billingDetails: OrderBillingDetails | null
  plan: {
    id: number
    name: string
    cpu: number
    ram: number
    storage: number
  }
  pricing: {
    id: number
    durationDays: number
    priceUsdCents: number
  }
  items: {
    id: number
    planId: number
    planPricingId: number
    planName: string
    planPriceUsdCents: number
    durationDays: number
    quantity: number
    lineTotalUsdCents: number
  }[]
  invoice: {
    id: number
    invoiceNumber: string
    subtotal: number
    discount: number
    totalAmount: number
    currency: string
    couponId: number | null
    couponCode: string | null
    status: "unpaid" | "paid" | "expired"
    expiresAt: string
    paidAt: string | null
  } | null
}

export function isBillingOrder(value: unknown): value is BillingOrder {
  if (!value || typeof value !== "object") {
    return false
  }

  const order = value as Partial<BillingOrder>

  return Boolean(
    typeof order.orderId === "number" &&
    order.plan &&
    typeof order.plan.name === "string" &&
    order.pricing &&
    typeof order.pricing.durationDays === "number" &&
    Array.isArray(order.items)
  )
}

export function useOrder(orderId: number | null) {
  return useQuery<BillingOrder>({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const order = await clientApi(`/orders/${orderId}`)

      if (!isBillingOrder(order)) {
        throw new Error("Order details are incomplete. Please refresh.")
      }

      return order
    },
    enabled: orderId != null,
    retry: false,
  })
}
