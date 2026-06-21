"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api/client"

import { webPaths } from "@/lib/paths"
import type { Transaction } from "@/hooks/use-transactions"

function parseTransactionId(value: string | null | undefined) {
  const transactionId = Number(value ?? "")

  return Number.isInteger(transactionId) && transactionId > 0
    ? transactionId
    : null
}

export function useCheckoutSuccess(transactionIdFromPath?: number | null) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const hasMounted = typeof window !== "undefined"
  const transactionId =
    transactionIdFromPath ??
    parseTransactionId(searchParams.get("transactionId"))
  const hasTransactionId = transactionId != null

  const {
    data: transaction = null,
    error,
    isLoading,
    refetch,
  } = useQuery<Transaction | null>({
    queryKey: ["checkout-transaction", transactionId],
    queryFn: () => {
      if (!transactionId) {
        return null
      }

      return fetchCheckoutTransaction(transactionId)
    },
    enabled: hasTransactionId,
    retry: false,
  })
  const hasSyncedCoinGateRef = useRef(false)

  useEffect(() => {
    if (!hasMounted || !transactionId) {
      return
    }

    const cleanPath = webPaths.checkoutSuccessTransaction(transactionId)

    if (pathname !== cleanPath || window.location.search) {
      router.replace(cleanPath, { scroll: false })
    }
  }, [hasMounted, pathname, router, transactionId])

  useEffect(() => {
    if (
      !transaction ||
      hasSyncedCoinGateRef.current ||
      transaction.method !== "coingate_checkout" ||
      transaction.status !== "pending"
    ) {
      return
    }

    hasSyncedCoinGateRef.current = true

    void clientApi(`/transactions/${transaction.id}/sync-coingate`, {
      method: "POST",
    })
      .catch(() => {
        // Keep success page readable; list still shows authoritative state.
      })
      .finally(() => {
        void refetch()
      })
  }, [refetch, transaction])

  return {
    error,
    hasMounted,
    transaction,
    hasTransactionId,
    isLoading,
  }
}

async function fetchCheckoutTransaction(transactionId: number) {
  try {
    return await clientApi<Transaction>(
      `/transactions/${transactionId}/checkout-status`
    )
  } catch (error) {
    const transactions = await clientApi<Transaction[]>("/transactions")
    const transaction = transactions.find((item) => item.id === transactionId)

    if (transaction) {
      return transaction
    }

    throw error
  }
}
