"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, Package02Icon } from "@hugeicons/core-free-icons"
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

import { useOrders } from "@/hooks/use-orders"
import { AdminOrdersTable } from "@/components/admin-orders/table"
import {
  OrderFilterControls,
  type InvoiceStatusControlValue,
  type OrderKindControlValue,
  type OrderStatusControlValue,
} from "@/components/admin-orders/filter-controls"

function OrdersSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Instance</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Order Status</TableHead>
          <TableHead>Invoice</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-36" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-44" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-28" />
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

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchValue, setSearchValue] = useState("")
  const [orderStatusFilter, setOrderStatusFilter] =
    useState<OrderStatusControlValue>("all")
  const [invoiceStatusFilter, setInvoiceStatusFilter] =
    useState<InvoiceStatusControlValue>("all")
  const [kindFilter, setKindFilter] = useState<OrderKindControlValue>("all")

  const { data, isLoading, isError, error } = useOrders({
    page,
    pageSize,
    search: searchValue,
    orderStatus:
      orderStatusFilter === "all" ? undefined : orderStatusFilter,
    invoiceStatus:
      invoiceStatusFilter === "all" ? undefined : invoiceStatusFilter,
    kind: kindFilter === "all" ? undefined : kindFilter,
  })

  const orders = data?.items ?? []
  const pagination = data?.pagination
  const totalCount = pagination?.totalCount ?? 0
  const pageStart =
    totalCount === 0 || !pagination
      ? 0
      : (pagination.page - 1) * pagination.pageSize + 1
  const pageEnd =
    totalCount === 0 || !pagination
      ? 0
      : Math.min(pageStart + orders.length - 1, totalCount)

  const hasActiveFilters =
    searchValue.trim().length > 0 ||
    orderStatusFilter !== "all" ||
    invoiceStatusFilter !== "all" ||
    kindFilter !== "all"

  const resetFilters = () => {
    setPage(1)
    setSearchValue("")
    setOrderStatusFilter("all")
    setInvoiceStatusFilter("all")
    setKindFilter("all")
  }

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">
          Review checkout and renewal orders across customers.
        </p>
      </div>

      <OrderFilterControls
        searchValue={searchValue}
        orderStatusFilter={orderStatusFilter}
        invoiceStatusFilter={invoiceStatusFilter}
        kindFilter={kindFilter}
        hasActiveFilters={hasActiveFilters}
        onSearchChange={(value) => {
          setPage(1)
          setSearchValue(value)
        }}
        onOrderStatusChange={(value) => {
          setPage(1)
          setOrderStatusFilter(value)
        }}
        onInvoiceStatusChange={(value) => {
          setPage(1)
          setInvoiceStatusFilter(value)
        }}
        onKindChange={(value) => {
          setPage(1)
          setKindFilter(value)
        }}
        onReset={resetFilters}
      />

      {isLoading ? (
        <div className="rounded-lg border">
          <OrdersSkeleton />
        </div>
      ) : isError ? (
        <div className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm text-destructive">
          <HugeiconsIcon
            icon={Alert02Icon}
            strokeWidth={2}
            className="size-4"
          />
          <span>{error.message || "Failed to load orders."}</span>
        </div>
      ) : totalCount === 0 && !hasActiveFilters ? (
        <div className="rounded-lg border">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Package02Icon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>No orders found</EmptyTitle>
              <EmptyDescription>
                Orders will appear here when users start checkout.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : totalCount === 0 ? (
        <div className="rounded-lg border">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Package02Icon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>No orders match filters</EmptyTitle>
              <EmptyDescription>
                Adjust filters or clear them to see all orders.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <AdminOrdersTable
          orders={orders}
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
