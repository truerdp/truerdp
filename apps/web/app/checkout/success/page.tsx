"use client"

import Link from "next/link"
import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  CreditCardIcon,
  Invoice03Icon,
} from "@hugeicons/core-free-icons"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { clientApi } from "@workspace/api"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Separator } from "@workspace/ui/components/separator"
import { formatAmount } from "@/lib/format"
import { useTransactions } from "@/hooks/use-transactions"
import { webPaths } from "@/lib/paths"

function CheckoutSuccessPageContent() {
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
        // Keep the success page readable; the transaction table still shows
        // the authoritative pending state if provider sync is not ready yet.
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
        // Keep the page readable; refetch below shows the authoritative state.
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

  const dashboardUrl =
    process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001"

  if (!hasTransactionId) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Missing transaction reference</EmptyTitle>
            <EmptyDescription>
              Start checkout from a plan to generate a transaction.
            </EmptyDescription>
          </EmptyHeader>
          <Link href={webPaths.home}>
            <Button>Back to plans</Button>
          </Link>
        </Empty>
      </main>
    )
  }

  if (!hasMounted || isLoading) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </CardContent>
        </Card>
      </main>
    )
  }

  if (!transaction) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Transaction not found</EmptyTitle>
            <EmptyDescription>
              The transaction may belong to a different user or is not loaded
              yet.
            </EmptyDescription>
          </EmptyHeader>
          <Link href={webPaths.home}>
            <Button>Choose a new plan</Button>
          </Link>
        </Empty>
      </main>
    )
  }

  const isFailed = transaction.status === "failed" || isProviderFailureReturn
  const title = isFailed
    ? "Payment failed"
    : transaction.status === "confirmed"
      ? "Payment confirmed"
      : "Transaction created successfully"
  const description = isFailed
    ? "The hosted checkout reported a failed payment. You can start a new order when ready."
    : transaction.status === "confirmed"
      ? "Your payment has been confirmed and your order is moving ahead."
      : "Your order is now pending admin confirmation and manual provisioning."
  const titleIcon = isFailed ? CreditCardIcon : CheckmarkCircle02Icon

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <HugeiconsIcon icon={titleIcon} strokeWidth={2} />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Transaction #{transaction.id}</Badge>
            {hasOrderId ? (
              <Badge variant="outline">Order #{orderId}</Badge>
            ) : null}
            <Badge
              variant={isFailed ? "destructive" : "outline"}
              className="capitalize"
            >
              {transaction.status}
            </Badge>
          </div>

          <div className="rounded-xl border p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">{transaction.plan.name}</span>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Invoice</span>
              <span>{transaction.invoice.invoiceNumber}</span>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">
                {formatAmount(transaction.amount)}
              </span>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Method</span>
              <span className="uppercase">{transaction.method}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`${dashboardUrl}/transactions`}
              target="_blank"
              rel="noreferrer"
            >
              <Button>
                <HugeiconsIcon
                  icon={Invoice03Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                Open dashboard transactions
              </Button>
            </a>
            <Link href={webPaths.home}>
              <Button variant={isFailed ? "default" : "outline"}>
                {isFailed ? "Choose another plan" : "Start another order"}
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                  data-icon="inline-end"
                />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

function CheckoutSuccessFallback() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </CardContent>
      </Card>
    </main>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<CheckoutSuccessFallback />}>
      <CheckoutSuccessPageContent />
    </Suspense>
  )
}
