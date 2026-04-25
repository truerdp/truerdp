"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { toast } from "sonner"
import { queryKeys } from "@/lib/query-keys"

type SuspendInput = {
  instanceId: number
  reason: string
}

async function invalidateInstanceQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  instanceId: number
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.allInstances() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.instanceDetails(instanceId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.expiredInstances() }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.expiringSoonInstances(),
    }),
  ])
}

export function useSuspendInstance() {
  const queryClient = useQueryClient()

  return useMutation<{ message: string }, Error, SuspendInput>({
    mutationFn: ({ instanceId, reason }) =>
      clientApi(`/admin/instances/${instanceId}/suspend`, {
        method: "POST",
        body: { reason },
      }),
    onSuccess: async (_data, variables) => {
      toast.success("Instance suspended successfully")
      await invalidateInstanceQueries(queryClient, variables.instanceId)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to suspend instance")
    },
  })
}

export function useUnsuspendInstance() {
  const queryClient = useQueryClient()

  return useMutation<{ message: string }, Error, SuspendInput>({
    mutationFn: ({ instanceId, reason }) =>
      clientApi(`/admin/instances/${instanceId}/unsuspend`, {
        method: "POST",
        body: { reason },
      }),
    onSuccess: async (_data, variables) => {
      toast.success("Instance suspension undone")
      await invalidateInstanceQueries(queryClient, variables.instanceId)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to undo suspension")
    },
  })
}
