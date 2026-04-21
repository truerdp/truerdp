"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { queryKeys } from "@/lib/query-keys"

export interface ExpiredInstance {
  id: number
  userId: number
  planId: number
  expiryDate: string | null
  status: "expired"
  createdAt: string | null
  daysSinceExpiry: number
}

export function useExpiredInstances() {
  return useQuery<ExpiredInstance[]>({
    queryKey: queryKeys.expiredInstances(),
    queryFn: () => clientApi("/admin/instances/expired"),
  })
}
