"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@workspace/api"
import { queryKeys } from "@/lib/query-keys"

export interface Instance {
  id: number
  userId: number
  status:
    | "pending"
    | "provisioning"
    | "active"
    | "expired"
    | "termination_pending"
    | "terminated"
  startDate: string | null
  expiryDate: string | null
  ipAddress: string | null
  provider: string | null
  resourceStatus: "creating" | "running" | "deleted" | null
}

export function useAllInstances() {
  return useQuery<Instance[]>({
    queryKey: queryKeys.allInstances(),
    queryFn: () => api("/admin/instances"),
  })
}
