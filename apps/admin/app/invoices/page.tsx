"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  Cancel01Icon,
  CreditCardIcon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { useInvoices, type AdminInvoiceSummary } from "@/hooks/use-invoices"

type InvoiceStatusFilter = "all" | "unpaid" | "paid" | "expired"
type TransactionStatusFilter =
  | "all"
  | "none"
  | "pending"
  | "confirmed"
  | "failed"
type MethodFilter = "all" | "none" | "upi" | "usdt_trc20" | "dodo_checkout"
type KindFilter = "all" | "new_purchase" | "renewal"

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return format(date, "MMM d, yyyy h:mm a")
}

function formatAmount(amount: number, currency: string) {
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

function formatMethod(method: AdminInvoiceSummary["transaction"]["method"]) {
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
    default:
      return String(method).toUpperCase()
  }
}

function getInvoiceStatusBadgeVariant(
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

function getTransactionStatusBadgeVariant(
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

function getUserDisplayName(user: {
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

function InvoicesSkeleton() {
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

function InvoicesEmpty() {
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

export default function AdminInvoicesPage() {
  const { data, isLoading, isError, error } = useInvoices()
  const invoices = data ?? []
  const [searchValue, setSearchValue] = useState("")
  const [invoiceStatusFilter, setInvoiceStatusFilter] =
    useState<InvoiceStatusFilter>("all")
  const [transactionStatusFilter, setTransactionStatusFilter] =
    useState<TransactionStatusFilter>("all")
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all")
  const [kindFilter, setKindFilter] = useState<KindFilter>("all")

  const hasActiveFilters =
    searchValue.trim().length > 0 ||
    invoiceStatusFilter !== "all" ||
    transactionStatusFilter !== "all" ||
    methodFilter !== "all" ||
    kindFilter !== "all"

  const filteredInvoices = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase()

    return invoices.filter((invoice) => {
      const invoiceStatusMatches =
        invoiceStatusFilter === "all" || invoice.status === invoiceStatusFilter

      const transactionStatus = invoice.transaction.status ?? "none"
      const transactionStatusMatches =
        transactionStatusFilter === "all" ||
        transactionStatus === transactionStatusFilter

      const method = invoice.transaction.method ?? "none"
      const methodMatches = methodFilter === "all" || method === methodFilter

      const kindMatches =
        kindFilter === "all" || invoice.plan.kind === kindFilter

      const searchableText = [
        invoice.invoiceNumber,
        invoice.transaction.reference ?? "",
        invoice.plan.name,
        String(invoice.id),
        String(invoice.order.id),
        String(invoice.order.userId),
        invoice.user.firstName,
        invoice.user.lastName,
        invoice.user.email,
      ]
        .join(" ")
        .toLowerCase()

      const queryMatches =
        normalizedQuery.length === 0 || searchableText.includes(normalizedQuery)

      return (
        invoiceStatusMatches &&
        transactionStatusMatches &&
        methodMatches &&
        kindMatches &&
        queryMatches
      )
    })
  }, [
    invoices,
    searchValue,
    invoiceStatusFilter,
    transactionStatusFilter,
    methodFilter,
    kindFilter,
  ])

  const resetFilters = () => {
    setSearchValue("")
    setInvoiceStatusFilter("all")
    setTransactionStatusFilter("all")
    setMethodFilter("all")
    setKindFilter("all")
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          Monitor unpaid invoices, payment attempts, and conversion status.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:max-w-sm">
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search invoice, tx ref, user, plan"
          />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Invoice status</p>
            <Select
              value={invoiceStatusFilter}
              onValueChange={(value) =>
                setInvoiceStatusFilter(value as InvoiceStatusFilter)
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Invoice status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All invoices</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Transaction status</p>
            <Select
              value={transactionStatusFilter}
              onValueChange={(value) =>
                setTransactionStatusFilter(value as TransactionStatusFilter)
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Transaction status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All transactions</SelectItem>
                <SelectItem value="none">No transaction</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Method</p>
            <Select
              value={methodFilter}
              onValueChange={(value) => setMethodFilter(value as MethodFilter)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                <SelectItem value="none">No method</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="dodo_checkout">Dodo Checkout</SelectItem>
                <SelectItem value="usdt_trc20">USDT (TRC20)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Type</p>
            <Select
              value={kindFilter}
              onValueChange={(value) => setKindFilter(value as KindFilter)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="new_purchase">New purchase</SelectItem>
                <SelectItem value="renewal">Renewal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            Clear
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-lg border">
          <InvoicesSkeleton />
        </div>
      ) : isError ? (
        <div className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm text-destructive">
          <HugeiconsIcon
            icon={Alert02Icon}
            strokeWidth={2}
            className="size-4"
          />
          <span>{error.message || "Failed to load invoices."}</span>
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-lg border">
          <InvoicesEmpty />
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="rounded-lg border">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>No invoices match filters</EmptyTitle>
              <EmptyDescription>
                Adjust filters or clear them to see all invoices.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="rounded-lg border">
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
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono text-sm">
                        {invoice.invoiceNumber}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        TX {invoice.transaction.reference || "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">
                        {getUserDisplayName(invoice.user)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {invoice.user.email}
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
                      variant={getInvoiceStatusBadgeVariant(invoice.status)}
                      className="uppercase"
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getTransactionStatusBadgeVariant(
                        invoice.transaction.status
                      )}
                      className="uppercase"
                    >
                      {invoice.transaction.status ?? "none"}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  )
}
