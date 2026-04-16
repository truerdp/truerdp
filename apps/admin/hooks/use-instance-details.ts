"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@workspace/api"
import { queryKeys } from "@/lib/query-keys"

export interface InstanceDetails {
  instance: {
    id: number
    userId: number
    planId: number
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
    terminatedAt: string | null
    provisionAttempts: number
    lastProvisionError: string | null
    createdAt: string
    updatedAt: string
  }
  plan: {
    id: number
    name: string
    cpu: number
    ram: number
    storage: number
  } | null
  user: {
    id: number
    email: string
    firstName: string
    lastName: string
  } | null
  resource: {
    id: number
    provider: string
    externalId: string | null
    ipAddress: string | null
    username: string | null
    status: "creating" | "running" | "stopped" | "failed" | "deleted"
    lastSyncedAt: string | null
    healthStatus: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export function useInstanceDetails(instanceId: number) {
  return useQuery<InstanceDetails>({
    queryKey: queryKeys.instanceDetails(instanceId),
    queryFn: () => api(`/admin/instances/${instanceId}`),
    enabled: !!instanceId,
  })
}
