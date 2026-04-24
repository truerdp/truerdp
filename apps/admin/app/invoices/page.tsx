"use client"

import { useState } from "react"
import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  Cancel01Icon,
  CreditCardIcon,
  FilterIcon,
} from "@hugeicons/core-free-icons"
import { AdminUserLink } from "@/components/admin-user-link"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
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
import { AdminPaginationControls } from "@/components/admin-pagination-controls"

type InvoiceStatusFilter = "all" | "unpaid" | "paid" | "expired"
type TransactionStatusFilter =
  | "all"
  | "none"
  | "pending"
  | "confirmed"
  | "failed"
type MethodFilter =
  | "all"
  | "none"
  | "upi"
  | "usdt_trc20"
  | "dodo_checkout"
  | "coingate_checkout"

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
    case "coingate_checkout":
      return "CoinGate"
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchValue, setSearchValue] = useState("")
  const [invoiceStatusFilter, setInvoiceStatusFilter] =
    useState<InvoiceStatusFilter>("all")
  const [transactionStatusFilter, setTransactionStatusFilter] =
    useState<TransactionStatusFilter>("all")
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all")

  const { data, isLoading, isError, error } = useInvoices({
    page,
    pageSize,
    search: searchValue,
    invoiceStatus:
      invoiceStatusFilter === "all" ? undefined : invoiceStatusFilter,
    transactionStatus:
      transactionStatusFilter === "all" ? undefined : transactionStatusFilter,
    method: methodFilter === "all" ? undefined : methodFilter,
  })

  const invoices = data?.items ?? []
  const pagination = data?.pagination
  const totalCount = pagination?.totalCount ?? 0
  const pageStart =
    totalCount === 0 || !pagination
      ? 0
      : (pagination.page - 1) * pagination.pageSize + 1
  const pageEnd =
    totalCount === 0 || !pagination
      ? 0
      : Math.min(pageStart + invoices.length - 1, totalCount)

  const hasActiveFilters =
    searchValue.trim().length > 0 ||
    invoiceStatusFilter !== "all" ||
    transactionStatusFilter !== "all" ||
    methodFilter !== "all"

  const activeFacetCount =
    Number(invoiceStatusFilter !== "all") +
    Number(transactionStatusFilter !== "all") +
    Number(methodFilter !== "all")

  const resetFilters = () => {
    setPage(1)
    setSearchValue("")
    setInvoiceStatusFilter("all")
    setTransactionStatusFilter("all")
    setMethodFilter("all")
  }

  return (
    <section className="min-w-0 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          Monitor unpaid invoices, payment attempts, and conversion status.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <Input
            value={searchValue}
            onChange={(event) => {
              setPage(1)
              setSearchValue(event.target.value)
            }}
            placeholder="Search invoice, tx ref, user, plan"
          />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Sheet>
            <SheetTrigger render={<Button type="button" variant="outline" />}>
              <HugeiconsIcon
                icon={FilterIcon}
                strokeWidth={2}
                className="size-4"
                data-icon="inline-start"
              />
              Filters
              {activeFacetCount > 0 ? ` (${activeFacetCount})` : ""}
            </SheetTrigger>
            <SheetContent className="sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Invoice Filters</SheetTitle>
                <SheetDescription>
                  Narrow down invoices by payment and transaction attributes.
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <p className="text-xs text-muted-foreground">
                    Invoice status
                  </p>
                  <Select
                    value={invoiceStatusFilter}
                    onValueChange={(value) => {
                      setPage(1)
                      setInvoiceStatusFilter(value as InvoiceStatusFilter)
                    }}
                  >
                    <SelectTrigger className="w-full">
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

                <div className="flex min-w-0 flex-col gap-1.5">
                  <p className="text-xs text-muted-foreground">
                    Transaction status
                  </p>
                  <Select
                    value={transactionStatusFilter}
                    onValueChange={(value) => {
                      setPage(1)
                      setTransactionStatusFilter(
                        value as TransactionStatusFilter
                      )
                    }}
                  >
                    <SelectTrigger className="w-full">
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

                <div className="flex min-w-0 flex-col gap-1.5">
                  <p className="text-xs text-muted-foreground">Method</p>
                  <Select
                    value={methodFilter}
                    onValueChange={(value) => {
                      setPage(1)
                      setMethodFilter(value as MethodFilter)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All methods</SelectItem>
                      <SelectItem value="none">No method</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="dodo_checkout">
                        Dodo Checkout
                      </SelectItem>
                      <SelectItem value="coingate_checkout">
                        CoinGate
                      </SelectItem>
                      <SelectItem value="usdt_trc20">USDT (TRC20)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SheetFooter>
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
                  Clear all
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

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
      ) : totalCount === 0 && !hasActiveFilters ? (
        <div className="rounded-lg border">
          <InvoicesEmpty />
        </div>
      ) : totalCount === 0 ? (
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
        <div className="space-y-3">
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
                {invoices.map((invoice) => (
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
                      <AdminUserLink
                        userId={invoice.user.id}
                        primary={getUserDisplayName(invoice.user)}
                        secondary={invoice.user.email}
                      />
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
                    <TableCell className="whitespace-normal text-muted-foreground">
                      {formatDateTime(invoice.createdAt)}
                    </TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">
                      {formatDateTime(invoice.paidAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            {pagination ? (
              <AdminPaginationControls
                page={pagination.page}
                totalPages={pagination.totalPages}
                pageSize={pagination.pageSize}
                totalCount={pagination.totalCount}
                pageStart={pageStart}
                pageEnd={pageEnd}
                onPageChange={setPage}
                onPageSizeChange={(value) => {
                  setPage(1)
                  setPageSize(value)
                }}
              />
            ) : null}
          </div>
        </div>
      )}
    </section>
  )
}
