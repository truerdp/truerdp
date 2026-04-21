"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { queryKeys } from "@/lib/query-keys"

export interface InstanceTransaction {
  id: number
  status: "pending" | "confirmed" | "failed"
  amount: number
  createdAt: string
}

export function useInstanceTransactions(id: string | number) {
  return useQuery<InstanceTransaction[]>({
    queryKey: queryKeys.instanceTransactions(id),
    queryFn: () => clientApi(`/instances/${id}/transactions`),
  })
}
