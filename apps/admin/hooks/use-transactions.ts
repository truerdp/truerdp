"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { queryKeys } from "@/lib/query-keys"

export interface AdminTransaction {
  id: number
  userId: number
  user: {
    id: number
    firstName: string
    lastName: string
    email: string
  }
  amount: number
  method: "dodo_checkout" | "upi" | "usdt_trc20"
  status: "pending" | "confirmed" | "failed"
  createdAt: string
  reference: string
  kind: "new_purchase" | "renewal"
  invoice: {
    id: number
    invoiceNumber: string
    status: "unpaid" | "paid" | "cancelled" | "expired"
    totalAmount: number
    currency: string
    expiresAt: string
    paidAt: string | null
  }
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
  instance: {
    id: number
    ipAddress: string | null
  } | null
}

export function useTransactions() {
  return useQuery<AdminTransaction[]>({
    queryKey: queryKeys.transactions(),
    queryFn: () => clientApi("/admin/transactions"),
  })
}
