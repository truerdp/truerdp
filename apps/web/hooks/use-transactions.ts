"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@workspace/api"
import { getAuthToken } from "@/lib/auth"

export interface Transaction {
  id: number
  amount: number
  method: "upi" | "usdt_trc20"
  status: "pending" | "confirmed" | "failed"
  createdAt: string
  confirmedAt: string | null
  reference: string
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
    price: number
  }
}

export function useTransactions() {
  const token = getAuthToken()

  return useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: () => api("/transactions"),
    enabled: Boolean(token),
    retry: false,
  })
}
