"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { toast } from "sonner"
import { queryKeys } from "@/lib/query-keys"

export interface PlanPricingInput {
  id?: number
  durationDays: number
  priceUsdCents: number
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
  isFeatured: boolean
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
      clientApi("/admin/plans", {
        method: "POST",
        body: input,
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
      clientApi(`/admin/plans/${planId}`, {
        method: "PUT",
        body: data,
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
      clientApi(`/admin/plans/${planId}/status`, {
        method: "PATCH",
        body: { isActive },
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

export function useTogglePlanFeatured() {
  const queryClient = useQueryClient()

  return useMutation<
    PlanMutationResponse,
    Error,
    {
      planId: number
      isFeatured: boolean
    }
  >({
    mutationFn: ({ planId, isFeatured }) =>
      clientApi(`/admin/plans/${planId}/featured`, {
        method: "PATCH",
        body: { isFeatured },
      }),
    onSuccess: async (_data, variables) => {
      toast.success(
        variables.isFeatured
          ? "Plan added to featured plans"
          : "Plan removed from featured plans"
      )

      await queryClient.invalidateQueries({
        queryKey: queryKeys.plans(),
      })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update featured status")
    },
  })
}
