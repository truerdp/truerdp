"use client"

import { Suspense } from "react"

import { useCheckoutSuccess } from "@/hooks/use-checkout-success"
import { Confetti } from "@/components/magicui/confetti"
import {
  CheckoutSuccessLoading,
  MissingTransactionReference,
  TransactionNotFound,
} from "@/components/checkout/success/states"
import { CheckoutSuccessSummaryCard } from "@/components/checkout/success/summary-card"

function CheckoutSuccessPageContent() {
  const {
    hasMounted,
    hasOrderId,
    hasTransactionId,
    isLoading,
    isProviderFailureReturn,
    orderId,
    transaction,
  } = useCheckoutSuccess()

  if (!hasTransactionId) {
    return <MissingTransactionReference />
  }

  if (!hasMounted || isLoading) {
    return <CheckoutSuccessLoading />
  }

  if (!transaction) {
    return <TransactionNotFound />
  }

  const showConfetti =
    transaction.status !== "failed" && !isProviderFailureReturn

  return (
    <>
      {showConfetti ? (
        <Confetti
          className="pointer-events-none fixed inset-0 z-50 size-full"
          options={{
            particleCount: 160,
            spread: 90,
            startVelocity: 36,
            scalar: 1.05,
          }}
        />
      ) : null}
      <CheckoutSuccessSummaryCard
        transaction={transaction}
        hasOrderId={hasOrderId}
        orderId={orderId}
        isProviderFailureReturn={isProviderFailureReturn}
      />
    </>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<CheckoutSuccessLoading />}>
      <CheckoutSuccessPageContent />
    </Suspense>
  )
}
