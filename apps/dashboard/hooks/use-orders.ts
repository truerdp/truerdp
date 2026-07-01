"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api/client"
import { queryKeys } from "@/lib/query-keys"

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

export interface OrderSummary {
  id: number
  userId: number
  kind: "new_purchase" | "renewal"
  status: "pending_payment" | "processing" | "completed" | "cancelled"
  billingDetails: OrderBillingDetails | null
  createdAt: string
  updatedAt: string
  plan: {
    id: number
    name: string
    cpu: number
    ram: number
    storage: number
    durationDays: number
    priceUsdCents: number
  }
  invoice: {
    id: number
    invoiceNumber: string | null
    status: "unpaid" | "paid" | "expired" | null
    totalAmount: number | null
    currency: string | null
    expiresAt: string | null
    paidAt: string | null
  } | null
  instance: {
    id: number
    status: string
  } | null
}

export interface BillingOrderDetails {
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
  items: Array<{
    id: number
    planId: number
    planPricingId: number
    planName: string
    planPriceUsdCents: number
    durationDays: number
    quantity: number
    lineTotalUsdCents: number
  }>
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

export function useOrders() {
  return useQuery<OrderSummary[]>({
    queryKey: queryKeys.orders(),
    queryFn: () => clientApi("/orders"),
  })
}

export function useOrder(id: string | number, enabled = true) {
  return useQuery<BillingOrderDetails>({
    queryKey: queryKeys.order(id),
    queryFn: () => clientApi(`/orders/${id}`),
    enabled,
  })
}
