"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"
import { Button } from "@workspace/ui/components/button"

interface RenewButtonProps {
  instanceId: number
  disabled?: boolean
}

export default function RenewButton({
  instanceId,
  disabled = false,
}: RenewButtonProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      return api(`/instances/${instanceId}/renew`, {
        method: "POST",
        body: JSON.stringify({}),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.instance(instanceId),
      })

      queryClient.invalidateQueries({
        queryKey: queryKeys.instanceTransactions(instanceId),
      })

      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions(),
      })

      queryClient.invalidateQueries({
        queryKey: queryKeys.instances(),
      })
    },
  })

  return (
    <Button
      disabled={mutation.isPending || disabled}
      onClick={() => mutation.mutate()}
    >
      {mutation.isPending ? "Processing..." : "Renew"}
    </Button>
  )
}
