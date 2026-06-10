"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { clientApi } from "@workspace/api/client"
import { useOrder, type BillingOrder } from "@/hooks/use-order"
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
    isLoading,
    error,
  } = useOrder(hasValidOrderId ? orderId : null)
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useProfile()
  const { data: transactions } = useTransactions()

  useEffect(() => {
    if (!hasValidOrderId || isProfileLoading || !isProfileError) {
      return
    }
    const redirectPath = webPaths.checkoutReviewOrder(orderId)
    router.push(
      `${webPaths.login}?redirect=${encodeURIComponent(redirectPath)}`
    )
  }, [hasValidOrderId, isProfileError, isProfileLoading, orderId, router])

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
    try {
      setIsUpdatingCoupon(true)
      const response = await clientApi<{ order: unknown; message: string }>(
        `/orders/${billingOrder.orderId}/coupon`,
        {
          method: "PATCH",
          body: { code },
        }
      )
      await queryClient.invalidateQueries({
        queryKey: ["order", billingOrder.orderId],
      })
      toast.success(response.message)
      if (!code) {
        setCouponCode("")
      }
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
