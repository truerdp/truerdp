"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@workspace/api"
import { queryKeys } from "@/lib/query-keys"

export interface Instance {
  id: number
  status:
    | "pending"
    | "provisioning"
    | "active"
    | "expired"
    | "termination_pending"
    | "terminated"
  ipAddress: string | null
  expiryDate: string | null
}

export function useInstances() {
  return useQuery<Instance[]>({
    queryKey: queryKeys.instances(),
    queryFn: () => api("/instances"),
  })
}
