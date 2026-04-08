"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@workspace/api"
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
    queryFn: () => api("/admin/instances/expired"),
  })
}
