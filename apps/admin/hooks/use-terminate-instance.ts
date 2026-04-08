"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@workspace/api"
import { toast } from "sonner"
import { queryKeys } from "@/lib/query-keys"

interface TerminateInstanceResponse {
  message: string
}

export function useTerminateInstance() {
  const queryClient = useQueryClient()

  return useMutation<TerminateInstanceResponse, Error, number>({
    mutationFn: (instanceId) =>
      api(`/admin/instances/${instanceId}/terminate`, {
        method: "POST",
      }),
    onSuccess: async () => {
      toast.success("Instance terminated successfully")

      await queryClient.invalidateQueries({
        queryKey: queryKeys.expiringSoonInstances(),
      })

      await queryClient.invalidateQueries({
        queryKey: queryKeys.expiredInstances(),
      })
    },
  })
}
