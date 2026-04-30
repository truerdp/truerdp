"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"

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

export function useOrder(orderId: number | null) {
  return useQuery<BillingOrder>({
    queryKey: ["order", orderId],
    queryFn: () => clientApi(`/orders/${orderId}`),
    enabled: orderId != null,
    retry: false,
  })
}
