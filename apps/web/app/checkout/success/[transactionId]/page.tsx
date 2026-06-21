"use client"

import { Suspense } from "react"
import { useParams } from "next/navigation"

import { useCheckoutSuccess } from "@/hooks/use-checkout-success"
import { Confetti } from "@/components/magicui/confetti"
import {
  CheckoutStatusUnavailable,
  CheckoutSuccessLoading,
  MissingTransactionReference,
  TransactionNotFound,
} from "@/components/checkout/success/states"
import { CheckoutSuccessSummaryCard } from "@/components/checkout/success/summary-card"

function CheckoutSuccessTransactionPageContent() {
  const params = useParams<{ transactionId: string }>()
  const transactionId = Number(params.transactionId ?? "")
  const hasValidTransactionId =
    Number.isInteger(transactionId) && transactionId > 0
  const { error, hasMounted, hasTransactionId, isLoading, transaction } =
    useCheckoutSuccess(hasValidTransactionId ? transactionId : null)

  if (!hasTransactionId) {
    return <MissingTransactionReference />
  }

  if (!hasMounted || isLoading) {
    return <CheckoutSuccessLoading />
  }

  if (error) {
    return <CheckoutStatusUnavailable message={error.message} />
  }

  if (!transaction) {
    return <TransactionNotFound />
  }

  const showConfetti = transaction.status === "confirmed"

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
      <CheckoutSuccessSummaryCard transaction={transaction} />
    </>
  )
}

export default function CheckoutSuccessTransactionPage() {
  return (
    <Suspense fallback={<CheckoutSuccessLoading />}>
      <CheckoutSuccessTransactionPageContent />
    </Suspense>
  )
}
