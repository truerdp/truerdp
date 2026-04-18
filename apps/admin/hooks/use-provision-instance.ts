"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@workspace/api"
import { toast } from "sonner"
import { queryKeys } from "@/lib/query-keys"

export interface ProvisionRequest {
  serverId: number
  username?: string
  password?: string
}

interface ProvisionResponse {
  message: string
}

export function useProvisionInstance() {
  const queryClient = useQueryClient()

  return useMutation<
    ProvisionResponse,
    Error,
    { instanceId: number; data: ProvisionRequest }
  >({
    mutationFn: ({ instanceId, data }) =>
      api(`/admin/instances/${instanceId}/provision`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: async () => {
      toast.success("Instance provisioned successfully")

      await queryClient.invalidateQueries({
        queryKey: queryKeys.transactions(),
      })

      await queryClient.invalidateQueries({
        queryKey: queryKeys.pendingTransactions(),
      })

      await queryClient.invalidateQueries({
        queryKey: queryKeys.allInstances(),
      })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to provision instance")
    },
  })
}
