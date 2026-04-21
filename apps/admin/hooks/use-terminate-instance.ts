"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { toast } from "sonner"
import { queryKeys } from "@/lib/query-keys"

interface TerminateInstanceResponse {
  message: string
}

export function useTerminateInstance() {
  const queryClient = useQueryClient()

  return useMutation<TerminateInstanceResponse, Error, number>({
    mutationFn: (instanceId) =>
      clientApi(`/admin/instances/${instanceId}/terminate`, {
        method: "POST",
      }),
    onSuccess: async (_data, instanceId) => {
      toast.success("Instance terminated successfully")

      await queryClient.invalidateQueries({
        queryKey: queryKeys.allInstances(),
      })

      await queryClient.invalidateQueries({
        queryKey: queryKeys.instanceDetails(instanceId),
      })

      await queryClient.invalidateQueries({
        queryKey: queryKeys.expiringSoonInstances(),
      })

      await queryClient.invalidateQueries({
        queryKey: queryKeys.expiredInstances(),
      })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to terminate instance")
    },
  })
}
