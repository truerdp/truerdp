"use client"

import Link from "next/link"
import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
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
  const { data, isLoading } = useTransactions()

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const transaction = useMemo(() => {
    if (!data || !hasTransactionId) {
      return null
    }

    return data.find((item) => item.id === transactionId) ?? null
  }, [data, hasTransactionId, transactionId])

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

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
            Transaction created successfully
          </CardTitle>
          <CardDescription>
            Your order is now pending admin confirmation and manual
            provisioning.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Transaction #{transaction.id}</Badge>
            {hasOrderId ? (
              <Badge variant="outline">Order #{orderId}</Badge>
            ) : null}
            <Badge variant="outline" className="capitalize">
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
              <Button variant="outline">
                Start another order
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
