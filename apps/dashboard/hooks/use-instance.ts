"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { queryKeys } from "@/lib/query-keys"

export interface InstanceDetailsData {
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
  username: string | null
  startDate: string | null
  expiryDate: string | null
}

export function useInstance(id: string | number) {
  return useQuery<InstanceDetailsData>({
    queryKey: queryKeys.instance(id),
    queryFn: () => clientApi(`/instances/${id}`),
  })
}
