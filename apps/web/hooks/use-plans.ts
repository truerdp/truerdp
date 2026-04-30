"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"

export interface PlanPricingOption {
  id: number
  durationDays: number
  priceUsdCents: number
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
  isFeatured: boolean
  defaultPricingId: number | null
  pricingOptions: PlanPricingOption[]
}

export function usePlans() {
  return useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: () => clientApi("/plans"),
  })
}
