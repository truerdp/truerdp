"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@workspace/api"
import { queryKeys } from "@/lib/query-keys"

export interface PlanPricingOption {
  id: number
  durationDays: number
  price: number
  isActive: boolean
}

export interface Plan {
  id: number
  name: string
  cpu: number
  ram: number
  storage: number
  isActive: boolean
  defaultPricingId: number | null
  pricingOptions: PlanPricingOption[]
}

export function usePlans() {
  return useQuery<Plan[]>({
    queryKey: queryKeys.plans(),
    queryFn: () => api("/admin/plans"),
  })
}
