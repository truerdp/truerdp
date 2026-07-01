import Link from "next/link"
import { format } from "date-fns"

import { buildWebCheckoutReviewUrl } from "@/lib/auth"
import { dashboardPaths } from "@/lib/paths"
import { formatAmount } from "@/lib/format"
import { type OrderSummary } from "@/hooks/use-orders"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

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

function getOrderStatusVariant(
  status: OrderSummary["status"]
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
  status: NonNullable<OrderSummary["invoice"]>["status"] | null | undefined
): "default" | "secondary" | "outline" {
  if (status === "paid") {
    return "default"
  }

  if (status === "expired") {
    return "secondary"
  }

  return "outline"
}

function getOrderKindLabel(kind: OrderSummary["kind"]) {
  return kind === "renewal" ? "Renewal" : "New purchase"
}

function isOrderPayable(order: OrderSummary) {
  return (
    order.status === "pending_payment" &&
    (!order.invoice || order.invoice.status === "unpaid")
  )
}

type OrdersTableProps = {
  orders: OrderSummary[]
}

export function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Instance</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Invoice</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell>
              <div className="flex flex-col">
                <Link
                  href={dashboardPaths.orderDetail(order.id)}
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
                  href={dashboardPaths.instanceDetail(order.instance.id)}
                  className="font-mono text-sm underline-offset-2 hover:underline"
                >
                  #{order.instance.id}
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{order.plan.name}</span>
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
                  {order.invoice?.invoiceNumber ?? "-"}
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
            <TableCell>
              <div className="flex items-center gap-2">
                <Link href={dashboardPaths.orderDetail(order.id)}>
                  <Button size="sm" variant="outline">
                    View order
                  </Button>
                </Link>
                {order.invoice ? (
                  <Link href={dashboardPaths.invoiceDetail(order.invoice.id)}>
                    <Button size="sm" variant="ghost">
                      Invoice
                    </Button>
                  </Link>
                ) : null}
                {isOrderPayable(order) ? (
                  <Button
                    size="sm"
                    onClick={() =>
                      window.location.assign(
                        buildWebCheckoutReviewUrl(order.id)
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
  )
}
