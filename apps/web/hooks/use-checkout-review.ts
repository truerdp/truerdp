"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { clientApi } from "@workspace/api"
import { useOrder, type BillingOrder } from "@/hooks/use-order"
import { useProfile } from "@/hooks/use-profile"
import { useTransactions } from "@/hooks/use-transactions"
import { findExistingPendingTransaction } from "@/hooks/checkout-helpers"
import { webPaths } from "@/lib/paths"
import {
  billingFormSchema,
  buildBillingPayload,
  emptyBillingForm,
  toBillingFormValues,
  type BillingFormValues,
} from "@/components/checkout/review/billing-form"
export function useCheckoutReview(orderId: number, hasValidOrderId: boolean) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isSavingBilling, setIsSavingBilling] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [isUpdatingCoupon, setIsUpdatingCoupon] = useState(false)

  const {
    register,
    reset,
    setError,
    clearErrors,
    trigger,
    getValues,
    control,
    formState: { errors },
  } = useForm<BillingFormValues>({
    resolver: zodResolver(billingFormSchema),
    defaultValues: emptyBillingForm,
    mode: "onChange",
  })
  const watchedBillingForm = useWatch({ control })
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
    if (!order) {
      return
    }

    reset(
      toBillingFormValues(
        order.billingDetails,
        profile
          ? {
              firstName: profile.firstName,
              lastName: profile.lastName,
              email: profile.email,
            }
          : null
      )
    )
    clearErrors("root")
  }, [clearErrors, order, profile, reset])

  useEffect(() => {
    if (!hasValidOrderId || isProfileLoading || !isProfileError) {
      return
    }
    const redirectPath = webPaths.checkoutReviewOrder(orderId)
    router.push(`${webPaths.login}?redirect=${encodeURIComponent(redirectPath)}`)
  }, [hasValidOrderId, isProfileError, isProfileLoading, orderId, router])

  useEffect(() => {
    setCouponCode(order?.invoice?.couponCode ?? "")
  }, [order?.invoice?.couponCode])

  const existingPendingTransaction = useMemo(() => {
    return findExistingPendingTransaction(transactions, orderId, hasValidOrderId)
  }, [hasValidOrderId, orderId, transactions])

  const billingPayload = useMemo(
    () =>
      buildBillingPayload({
        ...emptyBillingForm,
        ...watchedBillingForm,
      }),
    [watchedBillingForm]
  )

  const hasSavedBillingDetails = Boolean(order?.billingDetails)
  const hasUnsavedBillingChanges = useMemo(() => {
    if (!order?.billingDetails) {
      return true
    }

    return JSON.stringify(order.billingDetails) !== JSON.stringify(billingPayload)
  }, [billingPayload, order?.billingDetails])

  const persistBillingDetails = async (
    billingOrder: BillingOrder,
    values: BillingFormValues
  ): Promise<boolean> => {
    try {
      clearErrors("root")
      setIsSavingBilling(true)
      await clientApi(`/orders/${billingOrder.orderId}/billing`, {
        method: "PATCH",
        body: buildBillingPayload(values),
      })
      await queryClient.invalidateQueries({
        queryKey: ["order", billingOrder.orderId],
      })
      toast.success("Billing details saved")
      return true
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to save billing details"
      setError("root", { message })
      toast.error(message)
      return false
    } finally {
      setIsSavingBilling(false)
    }
  }

  const saveBillingDetails = async (billingOrder: BillingOrder) => {
    const isValid = await trigger()
    if (!isValid) {
      toast.error("Please complete required billing details")
      return false
    }
    return persistBillingDetails(billingOrder, getValues())
  }

  const updateCoupon = async (billingOrder: BillingOrder, code: string | null) => {
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
        submitError instanceof Error ? submitError.message : "Unable to update coupon"
      toast.error(message)
    } finally {
      setIsUpdatingCoupon(false)
    }
  }

  const proceedToPayment = async (billingOrder: BillingOrder) => {
    if (!profile) {
      const redirectPath = webPaths.checkoutReviewOrder(billingOrder.orderId)
      router.push(`${webPaths.login}?redirect=${encodeURIComponent(redirectPath)}`)
      return
    }

    if (!hasSavedBillingDetails || hasUnsavedBillingChanges) {
      const saved = await saveBillingDetails(billingOrder)
      if (!saved) {
        return
      }
    }
    router.push(webPaths.checkoutOrder(billingOrder.orderId))
  }

  return {
    order,
    isLoading,
    error,
    errors,
    control,
    register,
    isSavingBilling,
    isUpdatingCoupon,
    couponCode,
    setCouponCode,
    existingPendingTransaction,
    hasSavedBillingDetails,
    hasUnsavedBillingChanges,
    saveBillingDetails,
    updateCoupon,
    proceedToPayment,
  }
}
