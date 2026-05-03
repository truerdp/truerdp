"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  ArrowRight01Icon,
  CreditCardIcon,
  Invoice03Icon,
} from "@hugeicons/core-free-icons"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { webPaths } from "@/lib/paths"
import { BillingDetailsPanel } from "@/components/checkout/review/billing-details-panel"
import { OrderPricingPanel } from "@/components/checkout/review/order-pricing-panel"
import {
  CheckoutOrderNotFound,
  CheckoutReviewError,
  CheckoutReviewLoading,
  InvoiceFlowAlert,
  MissingOrderReference,
} from "@/components/checkout/review/states"
import { useCheckoutReview } from "@/hooks/use-checkout-review"

export default function CheckoutReviewPage() {
  const params = useParams<{ orderId: string }>()
  const orderId = Number(params.orderId ?? "")
  const hasValidOrderId = Number.isInteger(orderId) && orderId > 0
  const {
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
  } = useCheckoutReview(orderId, hasValidOrderId)

  if (!hasValidOrderId) {
    return <MissingOrderReference />
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="mb-4">
        <Link href={webPaths.home}>
          <Button variant="ghost" size="sm">
            <HugeiconsIcon
              icon={ArrowLeft02Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            Change plan
          </Button>
        </Link>
      </div>

      {isLoading ? <CheckoutReviewLoading /> : null}

      {!isLoading && error ? (
        <CheckoutReviewError message={(error as Error).message} />
      ) : null}

      {!isLoading && !error && !order ? <CheckoutOrderNotFound /> : null}

      {!isLoading && !error && order ? (
        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <HugeiconsIcon icon={Invoice03Icon} strokeWidth={2} />
              Invoice Review
            </CardTitle>
            <CardDescription>
              Review your generated invoice before choosing payment method.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{order.plan.name}</Badge>
              <Badge variant="outline">{order.pricing.durationDays} days</Badge>
              <Badge variant="outline">Order #{order.orderId}</Badge>
            </div>

            {order.status !== "pending_payment" ? (
              <Alert variant="destructive">
                <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
                <AlertTitle>Order is no longer payable</AlertTitle>
                <AlertDescription>
                  This order is currently in {order.status} state.
                </AlertDescription>
              </Alert>
            ) : null}

            <InvoiceFlowAlert
              invoiceNumber={existingPendingTransaction?.invoice.invoiceNumber}
              invoiceExpiresAt={existingPendingTransaction?.invoice.expiresAt}
            />

            <BillingDetailsPanel
              errors={errors}
              control={control}
              register={register}
              isSavingBilling={isSavingBilling}
              hasSavedBillingDetails={hasSavedBillingDetails}
              canSave={!isSavingBilling && order.status === "pending_payment"}
              onSave={() => {
                void saveBillingDetails(order)
              }}
            />

            <OrderPricingPanel
              order={order}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              existingPendingTransaction={Boolean(existingPendingTransaction)}
              isUpdatingCoupon={isUpdatingCoupon}
              onApplyCoupon={() => {
                void updateCoupon(order, couponCode)
              }}
              onRemoveCoupon={() => {
                void updateCoupon(order, null)
              }}
            />
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => {
                void proceedToPayment(order)
              }}
              disabled={order.status !== "pending_payment" || isSavingBilling}
            >
              {!hasSavedBillingDetails || hasUnsavedBillingChanges
                ? "Save billing & continue to payment"
                : existingPendingTransaction
                  ? "Continue to payment (reuse invoice)"
                  : "Continue to payment"}
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                data-icon="inline-end"
              />
            </Button>
          </CardFooter>
        </Card>
      ) : null}
    </main>
  )
}
