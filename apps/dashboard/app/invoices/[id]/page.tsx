"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  CreditCardIcon,
  Invoice03Icon,
} from "@hugeicons/core-free-icons"
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useInvoices, type InvoiceSummary } from "@/hooks/use-invoices"
import { buildWebCheckoutReviewUrl } from "@/lib/auth"
import { formatAmount } from "@/lib/format"
import { dashboardPaths } from "@/lib/paths"

function formatMethod(method: InvoiceSummary["transaction"]["method"]) {
  if (!method) {
    return "-"
  }

  return method === "upi" ? "UPI" : "USDT (TRC20)"
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

function getInvoiceUrgency(invoice: InvoiceSummary): {
  label: string
  variant: "outline" | "secondary" | "destructive"
} | null {
  if (invoice.status !== "unpaid" && invoice.status !== "expired") {
    return null
  }

  if (!invoice.expiresAt) {
    return null
  }

  const expiresAt = new Date(invoice.expiresAt).getTime()

  if (Number.isNaN(expiresAt)) {
    return null
  }

  const now = Date.now()

  if (invoice.status === "expired" || expiresAt < now) {
    return {
      label: "Overdue",
      variant: "destructive",
    }
  }

  const msRemaining = expiresAt - now
  const daysRemaining = Math.floor(msRemaining / (1000 * 60 * 60 * 24))

  if (daysRemaining <= 0) {
    return {
      label: "Expires today",
      variant: "secondary",
    }
  }

  return {
    label: `Expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`,
    variant: "outline",
  }
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

function InvoiceDetailsSkeleton() {
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-24" />
      </CardFooter>
    </Card>
  )
}

export default function InvoiceDetailsPage() {
  const { id } = useParams()
  const invoiceId = Number(String(id ?? ""))
  const hasValidInvoiceId = Number.isInteger(invoiceId) && invoiceId > 0
  const { data, isLoading, isError } = useInvoices()

  const invoice = useMemo(() => {
    if (!data || !hasValidInvoiceId) {
      return null
    }

    return data.find((item) => item.id === invoiceId) ?? null
  }, [data, hasValidInvoiceId, invoiceId])

  if (!hasValidInvoiceId) {
    return (
      <Empty className="max-w-3xl border">
        <EmptyHeader>
          <EmptyTitle>Missing invoice reference</EmptyTitle>
          <EmptyDescription>
            Open an invoice from the invoices list to view its full details.
          </EmptyDescription>
        </EmptyHeader>
        <Link href={dashboardPaths.invoices}>
          <Button variant="outline">
            <HugeiconsIcon
              icon={ArrowLeft02Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            Back to invoices
          </Button>
        </Link>
      </Empty>
    )
  }

  if (isLoading) {
    return <InvoiceDetailsSkeleton />
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="max-w-3xl">
        <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
        <AlertTitle>Failed to load invoice details</AlertTitle>
        <AlertDescription>
          Try refreshing the page or reopening this invoice from the list.
        </AlertDescription>
      </Alert>
    )
  }

  if (!invoice) {
    return (
      <Empty className="max-w-3xl border">
        <EmptyHeader>
          <EmptyTitle>Invoice not found</EmptyTitle>
          <EmptyDescription>
            This invoice may belong to another account or no longer exist.
          </EmptyDescription>
        </EmptyHeader>
        <Link href={dashboardPaths.invoices}>
          <Button variant="outline">
            <HugeiconsIcon
              icon={ArrowLeft02Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            Back to invoices
          </Button>
        </Link>
      </Empty>
    )
  }

  const payable = isInvoicePayable(invoice)
  const urgency = getInvoiceUrgency(invoice)

  return (
    <div className="space-y-4">
      <Link href={dashboardPaths.invoices}>
        <Button variant="ghost" size="sm">
          <HugeiconsIcon
            icon={ArrowLeft02Icon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          Back to invoices
        </Button>
      </Link>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <HugeiconsIcon icon={Invoice03Icon} strokeWidth={2} />
            Invoice {invoice.invoiceNumber}
          </CardTitle>
          <CardDescription>
            Review status, amount, and payment routing for this invoice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={getInvoiceStatusVariant(invoice.status)}
              className="uppercase"
            >
              {invoice.status}
            </Badge>
            <Badge variant="outline" className="uppercase">
              {invoice.order.status}
            </Badge>
            <Badge variant="outline">Order #{invoice.order.id}</Badge>
            {urgency ? (
              <Badge variant={urgency.variant}>{urgency.label}</Badge>
            ) : null}
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Plan</span>
            <span className="text-sm font-medium">{invoice.plan.name}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Type</span>
            <span className="text-sm">
              {invoice.plan.kind === "renewal" ? "Renewal" : "New purchase"}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Duration</span>
            <span className="text-sm">{invoice.plan.durationDays} days</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="text-base font-semibold">
              {formatAmount(invoice.totalAmount, invoice.currency)}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Method</span>
            <span className="text-sm">{formatMethod(invoice.transaction.method)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">
              Transaction Reference
            </span>
            <span className="text-sm font-mono">
              {invoice.transaction.reference || "-"}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Created</span>
            <span className="text-sm">{formatDateTime(invoice.createdAt)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Expires</span>
            <span className="text-sm">{formatDateTime(invoice.expiresAt)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Paid</span>
            <span className="text-sm">{formatDateTime(invoice.paidAt)}</span>
          </div>
        </CardContent>
        <CardFooter>
          {payable ? (
            <Button
              onClick={() =>
                window.location.assign(buildWebCheckoutReviewUrl(invoice.order.id))
              }
            >
              Pay now
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              This invoice is not currently payable.
            </span>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
