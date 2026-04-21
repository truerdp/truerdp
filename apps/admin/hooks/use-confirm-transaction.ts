"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { toast } from "sonner"
import { queryKeys } from "@/lib/query-keys"

interface ConfirmTransactionResponse {
  message: string
  instance: {
    id: number
    userId: number
    originOrderId: number
    planId: number
    status:
      | "pending"
      | "provisioning"
      | "active"
      | "expired"
      | "termination_pending"
      | "terminated"
      | "failed"
    startDate: string | null
    expiryDate: string | null
  } | null
  order: {
    id: number
    status: "processing" | "completed"
  }
  invoice: {
    id: number
    status: "paid"
  }
  transaction: {
    id: number
    status: "confirmed"
    confirmedAt: string
  }
  kind: "new_purchase" | "renewal"
}

export function useConfirmTransaction() {
  const queryClient = useQueryClient()

  return useMutation<ConfirmTransactionResponse, Error, number>({
    mutationFn: (transactionId) =>
      clientApi(`/admin/transactions/${transactionId}/confirm`, {
        method: "POST",
      }),
    onSuccess: async () => {
      toast.success("Transaction confirmed")

      await queryClient.invalidateQueries({
        queryKey: queryKeys.transactions(),
      })

      await queryClient.invalidateQueries({
        queryKey: queryKeys.invoices(),
      })

      await queryClient.invalidateQueries({
        queryKey: queryKeys.pendingTransactions(),
      })

      await queryClient.invalidateQueries({
        queryKey: queryKeys.expiringSoonInstances(),
      })

      await queryClient.invalidateQueries({
        queryKey: queryKeys.expiredInstances(),
      })
    },
  })
}
