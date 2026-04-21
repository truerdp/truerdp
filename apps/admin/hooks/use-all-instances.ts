"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
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
    | "failed"
  startDate: string | null
  expiryDate: string | null
  ipAddress: string | null
  provider: string | null
  resourceStatus: "active" | "released" | null
  extensionCount: number
  lastExtensionAt: string | null
  lastExtensionDays: number | null
}

export function useAllInstances() {
  return useQuery<Instance[]>({
    queryKey: queryKeys.allInstances(),
    queryFn: () => clientApi("/admin/instances"),
  })
}
