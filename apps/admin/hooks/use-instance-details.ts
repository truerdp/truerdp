"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
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
    username: string | null
    status: "active" | "released"
    assignedAt: string
    releasedAt: string | null
    createdAt: string
    updatedAt: string
  } | null
  server: {
    id: number
    provider: string
    externalId: string | null
    ipAddress: string
    cpu: number
    ram: number
    storage: number
    status: "available" | "assigned" | "cleaning" | "retired"
    lastAssignedAt: string | null
    createdAt: string
    updatedAt: string
  } | null
  extensionHistory: Array<{
    id: number
    previousExpiryDate: string
    newExpiryDate: string
    daysExtended: number
    createdAt: string
    extendedBy: {
      id: number
      email: string
      firstName: string
      lastName: string
    } | null
  }>
}

export function useInstanceDetails(instanceId: number) {
  return useQuery<InstanceDetails>({
    queryKey: queryKeys.instanceDetails(instanceId),
    queryFn: () => clientApi(`/admin/instances/${instanceId}`),
    enabled: !!instanceId,
  })
}
