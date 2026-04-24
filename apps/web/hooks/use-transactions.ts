"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"

export interface Transaction {
  id: number
  amount: number
  method: "dodo_checkout" | "coingate_checkout" | "upi" | "usdt_trc20"
  status: "pending" | "confirmed" | "failed"
  createdAt: string
  confirmedAt: string | null
  reference: string
  order: {
    id: number
    status: "pending_payment" | "processing" | "completed" | "cancelled"
  }
  invoice: {
    id: number
    invoiceNumber: string
    status: "unpaid" | "paid" | "cancelled" | "expired"
    totalAmount: number
    currency: string
    expiresAt: string
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
}

export function useTransactions() {
  return useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: () => clientApi("/transactions"),
    staleTime: 0,
    refetchOnMount: "always",
    retry: false,
  })
}
