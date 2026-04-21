"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { queryKeys } from "@/lib/query-keys"
import { buildWebCheckoutReviewUrl } from "@/lib/auth"
import { Button } from "@workspace/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

interface RenewButtonProps {
  instanceId: number
  disabled?: boolean
}

interface RenewOrderResponse {
  orderId: number
}

export default function RenewButton({
  instanceId,
  disabled = false,
}: RenewButtonProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      return clientApi<RenewOrderResponse>(`/instances/${instanceId}/renew`, {
        method: "POST",
        body: {},
      })
    },
    onSuccess: (response) => {
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

      window.location.assign(buildWebCheckoutReviewUrl(response.orderId))
    },
  })

  const button = (
    <Button
      disabled={mutation.isPending || disabled}
      onClick={() => mutation.mutate()}
    >
      {mutation.isPending ? "Processing..." : "Renew"}
    </Button>
  )

  if (disabled && !mutation.isPending) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={<span className="inline-flex">{button}</span>}
        />
        <TooltipContent>Renewal already in progress</TooltipContent>
      </Tooltip>
    )
  }

  return button
}
