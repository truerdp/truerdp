"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@workspace/api"
import { toast } from "sonner"
import { queryKeys } from "@/lib/query-keys"

export interface PlanPricingInput {
  id?: number
  durationDays: number
  price: number
  isActive: boolean
}

export interface UpsertPlanInput {
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
  defaultPricingId?: number | null
  pricingOptions: PlanPricingInput[]
}

interface PlanMutationResponse {
  message: string
}

export function useCreatePlan() {
  const queryClient = useQueryClient()

  return useMutation<PlanMutationResponse, Error, UpsertPlanInput>({
    mutationFn: (input) =>
      api("/admin/plans", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      toast.success("Plan created successfully")

      await queryClient.invalidateQueries({
        queryKey: queryKeys.plans(),
      })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create plan")
    },
  })
}

export function useUpdatePlan() {
  const queryClient = useQueryClient()

  return useMutation<
    PlanMutationResponse,
    Error,
    {
      planId: number
      data: UpsertPlanInput
    }
  >({
    mutationFn: ({ planId, data }) =>
      api(`/admin/plans/${planId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: async () => {
      toast.success("Plan updated successfully")

      await queryClient.invalidateQueries({
        queryKey: queryKeys.plans(),
      })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update plan")
    },
  })
}

export function useTogglePlanStatus() {
  const queryClient = useQueryClient()

  return useMutation<
    PlanMutationResponse,
    Error,
    {
      planId: number
      isActive: boolean
    }
  >({
    mutationFn: ({ planId, isActive }) =>
      api(`/admin/plans/${planId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: async (_data, variables) => {
      toast.success(
        variables.isActive
          ? "Plan activated successfully"
          : "Plan deactivated successfully"
      )

      await queryClient.invalidateQueries({
        queryKey: queryKeys.plans(),
      })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update plan status")
    },
  })
}
