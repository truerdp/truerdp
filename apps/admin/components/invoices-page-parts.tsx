import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import { CreditCardIcon } from "@hugeicons/core-free-icons"
import { Badge } from "@workspace/ui/components/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import type { AdminInvoiceSummary } from "@/hooks/use-invoices"

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return format(date, "MMM d, yyyy h:mm a")
}

export function formatAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 100)
  } catch {
    return `${(amount / 100).toLocaleString()} ${currency.toUpperCase()}`
  }
}

export function formatMethod(method: AdminInvoiceSummary["transaction"]["method"]) {
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

export function getInvoiceStatusBadgeVariant(
  status: AdminInvoiceSummary["status"]
): "default" | "secondary" | "outline" {
  if (status === "paid") {
    return "default"
  }

  if (status === "expired") {
    return "secondary"
  }

  return "outline"
}

export function getTransactionStatusBadgeVariant(
  status: AdminInvoiceSummary["transaction"]["status"]
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "confirmed") {
    return "default"
  }

  if (status === "pending") {
    return "secondary"
  }

  if (status === "failed") {
    return "destructive"
  }

  return "outline"
}

export function getUserDisplayName(user: {
  firstName: string
  lastName: string
  email: string
}) {
  const fullName = `${user.firstName} ${user.lastName}`.trim()

  if (fullName) {
    return fullName
  }

  return user.email
}

export function InvoicesSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Invoice Status</TableHead>
          <TableHead>Transaction</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Paid</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-40" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-12" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-40" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-28" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function InvoicesEmpty() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle>No invoices found</EmptyTitle>
        <EmptyDescription>
          Invoices will appear here when users start checkout.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function InvoiceStatusBadge({
  status,
}: {
  status: AdminInvoiceSummary["status"]
}) {
  return <Badge variant={getInvoiceStatusBadgeVariant(status)}>{status}</Badge>
}
