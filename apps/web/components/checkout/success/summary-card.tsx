import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  CreditCardIcon,
  Invoice03Icon,
} from "@hugeicons/core-free-icons"

import { formatAmount } from "@/lib/format"
import { webPaths } from "@/lib/paths"
import type { Transaction } from "@/hooks/use-transactions"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"

type CheckoutSuccessSummaryCardProps = {
  transaction: Transaction
  hasOrderId: boolean
  orderId: number
  isProviderFailureReturn: boolean
}

export function CheckoutSuccessSummaryCard({
  transaction,
  hasOrderId,
  orderId,
  isProviderFailureReturn,
}: CheckoutSuccessSummaryCardProps) {
  const dashboardUrl =
    process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001"

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
