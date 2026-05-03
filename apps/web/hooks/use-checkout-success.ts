"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { clientApi } from "@workspace/api"

import { useTransactions } from "@/hooks/use-transactions"

export function useCheckoutSuccess() {
  const searchParams = useSearchParams()
  const [hasMounted, setHasMounted] = useState(false)
  const orderId = Number(searchParams.get("orderId") ?? "")
  const hasOrderId = Number.isInteger(orderId) && orderId > 0
  const transactionId = Number(searchParams.get("transactionId") ?? "")
  const hasTransactionId = Number.isInteger(transactionId) && transactionId > 0
  const providerStatus = (searchParams.get("status") ?? "").toLowerCase()
  const providerPaymentId = searchParams.get("payment_id")
  const isProviderFailureReturn = [
    "failed",
    "failure",
    "cancelled",
    "canceled",
  ].includes(providerStatus)

  const { data, isLoading, refetch } = useTransactions()
  const [hasSyncedCoinGate, setHasSyncedCoinGate] = useState(false)
  const hasSyncedHostedReturnRef = useRef(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const transaction = useMemo(() => {
    if (!data || !hasTransactionId) {
      return null
    }
    return data.find((item) => item.id === transactionId) ?? null
  }, [data, hasTransactionId, transactionId])

  useEffect(() => {
    if (
      !transaction ||
      hasSyncedCoinGate ||
      transaction.method !== "coingate_checkout" ||
      transaction.status !== "pending"
    ) {
      return
    }

    setHasSyncedCoinGate(true)

    void clientApi(`/transactions/${transaction.id}/sync-coingate`, {
      method: "POST",
    })
      .catch(() => {
        // Keep success page readable; list still shows authoritative state.
      })
      .finally(() => {
        void refetch()
      })
  }, [hasSyncedCoinGate, refetch, transaction])

  useEffect(() => {
    if (
      !transaction ||
      !isProviderFailureReturn ||
      hasSyncedHostedReturnRef.current ||
      transaction.status !== "pending"
    ) {
      return
    }

    hasSyncedHostedReturnRef.current = true

    void clientApi(`/transactions/${transaction.id}/hosted-return`, {
      method: "POST",
      body: {
        status: providerStatus,
        paymentId: providerPaymentId,
      },
    })
      .catch(() => {
        // Keep page readable; refetch below shows authoritative state.
      })
      .finally(() => {
        void refetch()
      })
  }, [
    isProviderFailureReturn,
    providerPaymentId,
    providerStatus,
    refetch,
    transaction,
  ])

  return {
    hasMounted,
    orderId,
    hasOrderId,
    transaction,
    hasTransactionId,
    isLoading,
    isProviderFailureReturn,
  }
}
