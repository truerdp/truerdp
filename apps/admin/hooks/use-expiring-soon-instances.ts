"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { queryKeys } from "@/lib/query-keys"

export interface ExpiringSoonInstance {
  id: number
  userId: number
  planId: number
  expiryDate: string
  status: "active"
  createdAt: string
  daysUntilExpiry: number
}

export function useExpiringSoonInstances() {
  return useQuery<ExpiringSoonInstance[]>({
    queryKey: queryKeys.expiringSoonInstances(),
    queryFn: () => clientApi("/admin/instances/expiring-soon"),
  })
}
