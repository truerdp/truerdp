import Link from "next/link"

import { AdminUserLink } from "@/components/admin-user-link"
import { AdminPaginationControls } from "@/components/admin-pagination-controls"
import { formatAmount } from "@/components/invoices-page-parts"
import { adminPaths } from "@/lib/paths"
import type {
  AdminOrderListResponse,
  AdminOrderSummary,
} from "@/hooks/use-orders"
import { Badge } from "@workspace/ui/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function getUserDisplayName(user: AdminOrderSummary["user"]) {
  const fullName = `${user.firstName} ${user.lastName}`.trim()
  return fullName || user.email
}

function getOrderStatusVariant(
  status: AdminOrderSummary["status"]
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "completed") {
    return "default"
  }

  if (status === "processing") {
    return "secondary"
  }

  if (status === "cancelled") {
    return "destructive"
  }

  return "outline"
}

function getInvoiceStatusVariant(
  status: NonNullable<AdminOrderSummary["invoice"]>["status"] | null | undefined
): "default" | "secondary" | "outline" {
  if (status === "paid") {
    return "default"
  }

  if (status === "expired") {
    return "secondary"
  }

  return "outline"
}

function getOrderKindLabel(kind: AdminOrderSummary["kind"]) {
  return kind === "renewal" ? "Renewal" : "New purchase"
}

type AdminOrdersTableProps = {
  orders: AdminOrderSummary[]
  pagination: AdminOrderListResponse["pagination"] | undefined
  pageStart: number
  pageEnd: number
  onPageChange: (value: number) => void
  onPageSizeChange: (value: number) => void
}

export function AdminOrdersTable({
  orders,
  pagination,
  pageStart,
  pageEnd,
  onPageChange,
  onPageSizeChange,
}: AdminOrdersTableProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border">
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
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <Link
                      href={adminPaths.orderDetails(order.id)}
                      className="font-mono text-sm underline-offset-2 hover:underline"
                    >
                      #{order.id}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {getOrderKindLabel(order.kind)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {order.instance ? (
                    <Link
                      href={adminPaths.instanceDetails(order.instance.id)}
                      className="font-mono text-sm underline-offset-2 hover:underline"
                    >
                      #{order.instance.id}
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <AdminUserLink
                    userId={order.user.id}
                    primary={getUserDisplayName(order.user)}
                    secondary={order.user.email}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {order.plan.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {order.plan.durationDays} days - {order.plan.cpu} CPU,{" "}
                      {order.plan.ram} GB RAM
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {formatAmount(
                    order.invoice?.totalAmount ?? order.plan.priceUsdCents,
                    order.invoice?.currency ?? "USD"
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getOrderStatusVariant(order.status)}
                    className="uppercase"
                  >
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-sm">
                      {order.invoice ? (
                        <Link
                          href={adminPaths.invoiceDetails(order.invoice.id)}
                          className="underline-offset-2 hover:underline"
                        >
                          {order.invoice.invoiceNumber}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </span>
                    <Badge
                      variant={getInvoiceStatusVariant(order.invoice?.status)}
                      className="w-fit uppercase"
                    >
                      {order.invoice?.status ?? "none"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(order.createdAt)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(order.updatedAt)}
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
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        ) : null}
      </div>
    </div>
  )
}
