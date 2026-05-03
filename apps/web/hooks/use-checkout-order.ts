"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { clientApi } from "@workspace/api"

import { useOrder } from "@/hooks/use-order"
import { useProfile } from "@/hooks/use-profile"
import { useTransactions } from "@/hooks/use-transactions"
import { webPaths } from "@/lib/paths"

export type PaymentMethod =
  | "dodo_checkout"
  | "coingate_checkout"
  | "upi"
  | "usdt_trc20"

interface CreateTransactionResponse {
  id: number
  gatewayRedirectUrl?: string | null
}

export function useCheckoutOrder(orderId: number, hasValidOrderId: boolean) {
  const router = useRouter()
  const [method, setMethod] = useState<PaymentMethod>("dodo_checkout")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    data: order,
    isLoading,
    error,
  } = useOrder(hasValidOrderId ? orderId : null)
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useProfile()
  const { data: transactions } = useTransactions()

  const hasBillingDetails = order
    ? Boolean((order as unknown as { billingDetails?: unknown }).billingDetails)
    : false

  useEffect(() => {
    if (!hasValidOrderId || isProfileLoading || !isProfileError) {
      return
    }
    const redirectPath = webPaths.checkoutOrder(orderId)
    router.push(`${webPaths.login}?redirect=${encodeURIComponent(redirectPath)}`)
  }, [hasValidOrderId, isProfileError, isProfileLoading, orderId, router])

  const existingPendingTransaction = useMemo(() => {
    if (!transactions || !hasValidOrderId) {
      return null
    }

    const now = Date.now()

    return (
      transactions.find((transaction) => {
        const expiresAt = new Date(transaction.invoice.expiresAt).getTime()
        return (
          transaction.order.id === orderId &&
          transaction.status === "pending" &&
          transaction.invoice.status === "unpaid" &&
          !Number.isNaN(expiresAt) &&
          expiresAt >= now
        )
      }) ?? null
    )
  }, [hasValidOrderId, orderId, transactions])

  const createTransaction = async () => {
    if (!order || order.status !== "pending_payment") {
      return
    }

    if (!profile) {
      const redirectPath = webPaths.checkoutOrder(order.orderId)
      router.push(`${webPaths.login}?redirect=${encodeURIComponent(redirectPath)}`)
      return
    }

    try {
      setIsSubmitting(true)
      const transaction = await clientApi<CreateTransactionResponse>(
        "/transactions",
        {
          method: "POST",
          body: {
            orderId: order.orderId,
            method,
          },
        }
      )

      if (transaction.gatewayRedirectUrl) {
        window.location.assign(transaction.gatewayRedirectUrl)
        return
      }

      toast.success(
        existingPendingTransaction
          ? "Continuing with your existing unpaid invoice"
          : "Transaction created"
      )
      router.push(
        `${webPaths.checkoutSuccess}?orderId=${order.orderId}&transactionId=${transaction.id}`
      )
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to create transaction"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    order,
    isLoading,
    error,
    method,
    setMethod,
    isSubmitting,
    hasBillingDetails,
    existingPendingTransaction,
    createTransaction,
  }
}
