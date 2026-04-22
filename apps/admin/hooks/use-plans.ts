"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { queryKeys } from "@/lib/query-keys"

export interface PlanPricingOption {
  id: number
  durationDays: number
  priceUsdCents: number
  isActive: boolean
  dodoProductId?: string | null
  dodoSyncStatus?: "pending" | "synced" | "failed"
  dodoSyncError?: string | null
  dodoSyncedAt?: string | null
}

export interface Plan {
  id: number
  name: string
  cpu: number
  cpuName: string
  cpuThreads: number
  ram: number
  ramType: string
  storage: number
  storageType: "HDD" | "SSD"
  bandwidth: string
  os: string
  osVersion: string
  planType: "Dedicated" | "Residential"
  portSpeed: string
  setupFees: number
  planLocation: string
  isActive: boolean
  defaultPricingId: number | null
  pricingOptions: PlanPricingOption[]
}

export function usePlans() {
  return useQuery<Plan[]>({
    queryKey: queryKeys.plans(),
    queryFn: () => clientApi("/admin/plans"),
  })
}
