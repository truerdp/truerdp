"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { queryKeys } from "@/lib/query-keys"

export interface Transaction {
  id: number
  amount: number
  method: "upi" | "usdt_trc20" | "dodo_checkout"
  status: "pending" | "confirmed" | "failed"
  createdAt: string
  confirmedAt: string | null

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
