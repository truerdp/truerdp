"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  CreditCardIcon,
} from "@hugeicons/core-free-icons"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { useInvoices } from "@/hooks/use-invoices"
import {
  InvoicesEmpty,
  InvoicesSkeleton,
} from "@/components/invoices-page-parts"
import {
  InvoiceFilterControls,
  type InvoiceStatusFilter,
  type MethodFilter,
  type TransactionStatusFilter,
} from "@/components/admin-invoices/filter-controls"
import { AdminInvoicesTable } from "@/components/admin-invoices/table"

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

      <InvoiceFilterControls
        searchValue={searchValue}
        invoiceStatusFilter={invoiceStatusFilter}
        transactionStatusFilter={transactionStatusFilter}
        methodFilter={methodFilter}
        activeFacetCount={activeFacetCount}
        hasActiveFilters={hasActiveFilters}
        onSearchChange={(value) => {
          setPage(1)
          setSearchValue(value)
        }}
        onInvoiceStatusChange={(value) => {
          setPage(1)
          setInvoiceStatusFilter(value)
        }}
        onTransactionStatusChange={(value) => {
          setPage(1)
          setTransactionStatusFilter(value)
        }}
        onMethodChange={(value) => {
          setPage(1)
          setMethodFilter(value)
        }}
        onReset={resetFilters}
      />

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
        <AdminInvoicesTable
          invoices={invoices}
          pagination={pagination}
          pageStart={pageStart}
          pageEnd={pageEnd}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPage(1)
            setPageSize(value)
          }}
        />
      )}
    </section>
  )
}
