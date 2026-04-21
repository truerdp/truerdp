"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { queryKeys } from "@/lib/query-keys"

export interface PendingTransaction {
  id: number
  userId: number
  amount: number
  method: "upi" | "usdt_trc20"
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
    price: number
  }
  instance: {
    id: number
    ipAddress: string | null
  } | null
}

export function usePendingTransactions() {
  return useQuery<PendingTransaction[]>({
    queryKey: queryKeys.pendingTransactions(),
    queryFn: () => clientApi("/admin/transactions/pending"),
  })
}
