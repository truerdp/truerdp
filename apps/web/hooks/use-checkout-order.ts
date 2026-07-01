"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { clientApi } from "@workspace/api/client"

import { useOrder } from "@/hooks/use-order"
import { usePaymentSettings, type PaymentMethod } from "@/hooks/use-payment-settings"
import { useProfile } from "@/hooks/use-profile"
import { useTransactions } from "@/hooks/use-transactions"
import { findExistingPendingTransaction } from "@/hooks/checkout-helpers"
import { webPaths } from "@/lib/paths"

interface CreateTransactionResponse {
  id: number
  gatewayRedirectUrl?: string | null
}

export function useCheckoutOrder(orderId: number, hasValidOrderId: boolean) {
  const router = useRouter()
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [txId, setTxId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    data: order,
    isLoading: isOrderLoading,
    error: orderError,
  } = useOrder(hasValidOrderId ? orderId : null)
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useProfile()
  const {
    data: paymentSettings,
    isLoading: isPaymentSettingsLoading,
    error: paymentSettingsError,
  } = usePaymentSettings()
  const { data: transactions } = useTransactions()

  const isAuthenticated = !isProfileLoading && Boolean(profile)
  const error = paymentSettingsError ?? (isAuthenticated ? orderError : null)
  const isLoading =
    isOrderLoading || isProfileLoading || isPaymentSettingsLoading

  const hasBillingDetails = order
    ? Boolean((order as unknown as { billingDetails?: unknown }).billingDetails)
    : false

  useEffect(() => {
    if (!paymentSettings) {
      return
    }

    if (paymentSettings.enabledMethods.length === 0) {
      if (method !== null) {
        setMethod(null)
      }
      return
    }

    if (!method || !paymentSettings.enabledMethods.includes(method)) {
      setMethod(paymentSettings.enabledMethods[0] ?? null)
    }
  }, [paymentSettings, method])

  useEffect(() => {
    if (!hasValidOrderId || isProfileLoading) {
      return
    }

    if (isProfileError || !profile) {
      const redirectPath = webPaths.checkoutOrder(orderId)
      router.push(
        `${webPaths.login}?redirect=${encodeURIComponent(redirectPath)}`
      )
    }
  }, [hasValidOrderId, isProfileError, isProfileLoading, profile, orderId, router])

  const existingPendingTransaction = useMemo(() => {
    return findExistingPendingTransaction(
      transactions,
      orderId,
      hasValidOrderId
    )
  }, [hasValidOrderId, orderId, transactions])

  const createTransaction = async () => {
    if (!order || order.status !== "pending_payment") {
      return
    }

    if (!method) {
      toast.error("No payment methods are currently available")
      return
    }

    if (!profile) {
      const redirectPath = webPaths.checkoutOrder(order.orderId)
      router.push(
        `${webPaths.login}?redirect=${encodeURIComponent(redirectPath)}`
      )
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
            ...(method === "usdt_trc20" ? { txId } : {}),
          },
        }
      )

      if (!Number.isInteger(transaction.id) || transaction.id <= 0) {
        throw new Error(
          "Payment transaction was created without a reference. Please refresh and try again."
        )
      }

      if (transaction.gatewayRedirectUrl) {
        window.location.assign(transaction.gatewayRedirectUrl)
        return
      }

      toast.success(
        existingPendingTransaction
          ? "Continuing with your existing unpaid invoice"
          : "Transaction created"
      )
      router.push(webPaths.checkoutSuccessTransaction(transaction.id))
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
    paymentSettings,
    txId,
    setTxId,
    isSubmitting,
    hasBillingDetails,
    existingPendingTransaction,
    createTransaction,
  }
}
