"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { toast } from "sonner"
import { queryKeys } from "@/lib/query-keys"

export function useFailTransaction() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: (transactionId) =>
      clientApi(`/admin/transactions/${transactionId}/fail`, {
        method: "POST",
        body: {
          reason: "Admin marked transaction as failed",
        },
      }),
    onSuccess: async () => {
      toast.success("Transaction marked as failed")

      await queryClient.invalidateQueries({
        queryKey: queryKeys.transactions(),
      })

      await queryClient.invalidateQueries({
        queryKey: queryKeys.invoices(),
      })

      await queryClient.invalidateQueries({
        queryKey: queryKeys.pendingTransactions(),
      })
    },
  })
}
