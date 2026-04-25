"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { queryKeys } from "@/lib/query-keys"

export interface Instance {
  id: number
  status:
    | "pending"
    | "provisioning"
    | "active"
    | "suspended"
    | "expired"
    | "termination_pending"
    | "terminated"
    | "failed"
  ipAddress: string | null
  expiryDate: string | null
}

export function useInstances() {
  return useQuery<Instance[]>({
    queryKey: queryKeys.instances(),
    queryFn: () => clientApi("/instances"),
  })
}
