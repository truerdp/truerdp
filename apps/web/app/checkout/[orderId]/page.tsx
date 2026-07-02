"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { webPaths } from "@/lib/paths"
import { BackButton } from "@workspace/ui/components/back-button"
import { CheckoutPaymentCard } from "@/components/checkout/order/payment-card"
import {
  CheckoutOrderError,
  CheckoutOrderLoading,
  CheckoutOrderNotFound,
  MissingOrderReference,
} from "@/components/checkout/order/states"
import { useCheckoutOrder } from "@/hooks/use-checkout-order"

export default function CheckoutOrderPage() {
  const params = useParams<{ orderId: string }>()
  const orderId = Number(params.orderId ?? "")
  const hasValidOrderId = Number.isInteger(orderId) && orderId > 0
  const {
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
  } = useCheckoutOrder(orderId, hasValidOrderId)

  if (!hasValidOrderId) {
    return <MissingOrderReference />
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="mb-4">
        <BackButton render={<Link href={webPaths.checkoutReviewOrder(orderId)} />}>
          Back to invoice review
        </BackButton>
      </div>

      {isLoading ? <CheckoutOrderLoading /> : null}
      {!isLoading && error ? (
        <CheckoutOrderError message={(error as Error).message} />
      ) : null}
      {!isLoading && !error && !order ? <CheckoutOrderNotFound /> : null}

      {!isLoading && !error && order && paymentSettings ? (
        <CheckoutPaymentCard
          order={order}
          method={method}
          setMethod={setMethod}
          paymentSettings={paymentSettings}
          txId={txId}
          setTxId={setTxId}
          isSubmitting={isSubmitting}
          hasBillingDetails={hasBillingDetails}
          existingPendingTransaction={existingPendingTransaction}
          onCreateTransaction={() => {
            void createTransaction()
          }}
        />
      ) : null}
    </main>
  )
}
