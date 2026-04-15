"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@workspace/api"

export interface PlanPricingOption {
  id: number
  durationDays: number
  price: number
}

export interface Plan {
  id: number
  name: string
  cpu: number
  ram: number
  storage: number
  defaultPricingId: number | null
  pricingOptions: PlanPricingOption[]
}

export function usePlans() {
  return useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: () => api("/plans"),
  })
}
