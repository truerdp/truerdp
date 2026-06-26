"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { clientApi } from "@workspace/api/client"
import { isBillingOrder, useOrder, type BillingOrder } from "@/hooks/use-order"
import { useProfile } from "@/hooks/use-profile"
import { useTransactions } from "@/hooks/use-transactions"
import { findExistingPendingTransaction } from "@/hooks/checkout-helpers"
import { webPaths } from "@/lib/paths"
export function useCheckoutReview(orderId: number, hasValidOrderId: boolean) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [couponCode, setCouponCode] = useState("")
  const [isUpdatingCoupon, setIsUpdatingCoupon] = useState(false)

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
  const { data: transactions } = useTransactions()

  const isAuthenticated = !isProfileLoading && Boolean(profile)
  const error = isAuthenticated ? orderError : null
  const isLoading = isOrderLoading || isProfileLoading

  useEffect(() => {
    if (!hasValidOrderId || isProfileLoading) {
      return
    }

    if (isProfileError || !profile) {
      const redirectPath = webPaths.checkoutReviewOrder(orderId)
      router.push(
        `${webPaths.login}?redirect=${encodeURIComponent(redirectPath)}`
      )
    }
  }, [
    hasValidOrderId,
    isProfileError,
    isProfileLoading,
    profile,
    orderId,
    router,
  ])

  useEffect(() => {
    setCouponCode(order?.invoice?.couponCode ?? "")
  }, [order?.invoice?.couponCode])

  const existingPendingTransaction = useMemo(() => {
    return findExistingPendingTransaction(
      transactions,
      orderId,
      hasValidOrderId
    )
  }, [hasValidOrderId, orderId, transactions])

  const hasSavedBillingDetails = Boolean(order?.billingDetails)

  const updateCoupon = async (
    billingOrder: BillingOrder,
    code: string | null
  ) => {
    const normalizedCode = code === null ? null : code.trim()

    try {
      setIsUpdatingCoupon(true)
      const response = await clientApi<{
        order: BillingOrder
        message: string
      }>(`/orders/${billingOrder.orderId}/coupon`, {
        method: "PATCH",
        body: { code: normalizedCode },
      })
      if (!isBillingOrder(response.order)) {
        throw new Error("Order details are incomplete. Please refresh.")
      }

      queryClient.setQueryData(["order", billingOrder.orderId], response.order)
      await queryClient.invalidateQueries({
        queryKey: ["order", billingOrder.orderId],
      })
      setCouponCode(response.order.invoice?.couponCode ?? "")
      toast.success(response.message)
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to update coupon"
      toast.error(message)
    } finally {
      setIsUpdatingCoupon(false)
    }
  }

  const proceedToPayment = async (billingOrder: BillingOrder) => {
    if (!profile) {
      const redirectPath = webPaths.checkoutReviewOrder(billingOrder.orderId)
      router.push(
        `${webPaths.login}?redirect=${encodeURIComponent(redirectPath)}`
      )
      return
    }

    if (!billingOrder.billingDetails) {
      toast.error("Complete your billing address before payment")
      return
    }

    router.push(webPaths.checkoutOrder(billingOrder.orderId))
  }

  return {
    order,
    isLoading,
    error,
    isUpdatingCoupon,
    couponCode,
    setCouponCode,
    existingPendingTransaction,
    hasSavedBillingDetails,
    updateCoupon,
    proceedToPayment,
  }
}
