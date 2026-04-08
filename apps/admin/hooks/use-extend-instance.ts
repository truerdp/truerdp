"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@workspace/api"
import { toast } from "sonner"
import { queryKeys } from "@/lib/query-keys"

interface ExtendInstanceInput {
  instanceId: number
  days: number
}

interface ExtendInstanceResponse {
  message: string
  newExpiryDate: string
}

export function useExtendInstance() {
  const queryClient = useQueryClient()

  return useMutation<ExtendInstanceResponse, Error, ExtendInstanceInput>({
    mutationFn: ({ instanceId, days }) =>
      api(`/admin/instances/${instanceId}/extend`, {
        method: "POST",
        body: JSON.stringify({ days }),
      }),
    onSuccess: async () => {
      toast.success("Instance extended successfully")

      await queryClient.invalidateQueries({
        queryKey: queryKeys.expiredInstances(),
      })

      await queryClient.invalidateQueries({
        queryKey: queryKeys.expiringSoonInstances(),
      })
    },
  })
}
