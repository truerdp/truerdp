"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api/client"
import { queryKeys } from "@/lib/query-keys"

export interface Transaction {
  id: number
  amount: number
  method:
    | "upi"
    | "usdt_trc20"
    | "dodo_checkout"
    | "coingate_checkout"
    | "paypal_checkout"
  status: "pending" | "confirmed" | "failed"
  reference: string | null
  cryptoTxId: string | null
  createdAt: string
  confirmedAt: string | null
  failureReason: string | null
  kind: "new_purchase" | "renewal"
  order: {
    id: number
    status: string
  }
  invoice: {
    id: number
    invoiceNumber: string
    status: "unpaid" | "paid" | "expired"
    totalAmount: number
    currency: string
    expiresAt: string
    paidAt: string | null
    createdAt: string
  }
  pricing: {
    id: number
    durationDays: number
    priceUsdCents: number | null
  }

  plan: {
    id: number
    name: string
    cpu: number
    ram: number
    storage: number
  }

  instance: {
    id: number
    ipAddress: string | null
  } | null
}

export function useTransactions() {
  return useQuery<Transaction[]>({
    queryKey: queryKeys.transactions(),
    queryFn: () => clientApi("/transactions"),
  })
}

export function useTransaction(id: string | number, enabled = true) {
  return useQuery<Transaction>({
    queryKey: queryKeys.transaction(id),
    queryFn: () => clientApi(`/transactions/${id}`),
    enabled,
  })
}
