"use client"

import Link from "next/link"
import { format } from "date-fns"
import { useInvoices, type InvoiceSummary } from "@/hooks/use-invoices"
import { buildWebCheckoutReviewUrl } from "@/lib/auth"
import { formatAmount } from "@/lib/format"
import { dashboardPaths } from "@/lib/paths"
import { HugeiconsIcon } from "@hugeicons/react"
import { CreditCardIcon } from "@hugeicons/core-free-icons"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

function formatMethod(method: InvoiceSummary["transaction"]["method"]) {
  if (!method) {
    return "-"
  }

  switch (method) {
    case "upi":
      return "UPI"
    case "usdt_trc20":
      return "USDT (TRC20)"
    case "dodo_checkout":
      return "Dodo Checkout"
    case "coingate_checkout":
      return "CoinGate"
    default:
      return String(method).toUpperCase()
  }
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return format(date, "MMM d, yyyy h:mm a")
}

function getInvoiceStatusVariant(
  status: InvoiceSummary["status"]
): "default" | "outline" | "secondary" {
  if (status === "paid") {
    return "default"
  }

  if (status === "expired") {
    return "secondary"
  }

  return "outline"
}

function isInvoicePayable(invoice: InvoiceSummary) {
  if (invoice.status !== "unpaid") {
    return false
  }

  if (invoice.order.status !== "pending_payment") {
    return false
  }

  if (!invoice.expiresAt) {
    return true
  }

  const expiresAt = new Date(invoice.expiresAt).getTime()
  return !Number.isNaN(expiresAt) && expiresAt >= Date.now()
}

function InvoicesSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Paid</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-44" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-20" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function InvoicesEmpty() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle>No invoices yet</EmptyTitle>
        <EmptyDescription>
          Invoices will appear here after you create or renew instances.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export default function InvoicesPage() {
  const { data, isLoading, isError } = useInvoices()
  const invoices = data ?? []

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            View your billing history and payment outcomes.
          </p>
        </div>
        <div className="rounded-lg border">
          <InvoicesSkeleton />
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <div className="text-sm text-destructive">Failed to load invoices.</div>
    )
  }

  if (invoices.length === 0) {
    return (
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            View your billing history and payment outcomes.
          </p>
        </div>
        <div className="rounded-lg border">
          <InvoicesEmpty />
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          View your billing history and payment outcomes.
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <Link
                      href={dashboardPaths.invoiceDetail(invoice.id)}
                      className="font-mono text-sm underline-offset-2 hover:underline"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      TX {invoice.transaction.reference || "-"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {invoice.plan.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {invoice.plan.durationDays} days ·{" "}
                      {invoice.plan.kind === "renewal"
                        ? "Renewal"
                        : "New purchase"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {formatAmount(invoice.totalAmount, invoice.currency)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getInvoiceStatusVariant(invoice.status)}
                    className="uppercase"
                  >
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {formatMethod(invoice.transaction.method)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(invoice.createdAt)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(invoice.paidAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link href={dashboardPaths.invoiceDetail(invoice.id)}>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Link>
                    {isInvoicePayable(invoice) ? (
                      <Button
                        size="sm"
                        onClick={() =>
                          window.location.assign(
                            buildWebCheckoutReviewUrl(invoice.order.id)
                          )
                        }
                      >
                        Pay now
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
