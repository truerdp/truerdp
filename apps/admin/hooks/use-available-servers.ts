"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"

export interface Server {
  id: number
  provider: string
  externalId: string | null
  ipAddress: string
  cpu: number
  ram: number
  storage: number
  status: string
  lastAssignedAt: string | null
  createdAt: string
  updatedAt: string
}

export function useAvailableServers() {
  return useQuery<Server[], Error>({
    queryKey: ["servers", "available"],
    queryFn: () => clientApi("/admin/servers/available"),
    staleTime: 30000, // 30 seconds
  })
}
