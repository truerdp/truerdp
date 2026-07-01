"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"

import { useOrder } from "@/hooks/use-orders"
import { buildWebCheckoutReviewUrl } from "@/lib/auth"
import { formatAmount } from "@/lib/format"
import { dashboardPaths } from "@/lib/paths"
import { Badge } from "@workspace/ui/components/badge"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"

function formatDateTime(value: string | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(date)
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-right text-sm">{value}</span>
      </div>
      <Separator />
    </>
  )
}

export default function OrderDetailsPage() {
  const { id } = useParams()
  const orderId = Number(String(id ?? ""))
  const hasValidOrderId = Number.isInteger(orderId) && orderId > 0
  const { data: order, isLoading, isError } = useOrder(orderId, hasValidOrderId)

  if (!hasValidOrderId) {
    return (
      <Empty className="w-full border">
        <EmptyHeader>
          <EmptyTitle>Missing order reference</EmptyTitle>
          <EmptyDescription>Open an order from the orders list.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  if (isLoading) {
    return <Skeleton className="h-80 w-full" />
  }

  if (isError || !order) {
    return (
      <Empty className="w-full border">
        <EmptyHeader>
          <EmptyTitle>Order not found</EmptyTitle>
          <EmptyDescription>
            This order may belong to another account or no longer exist.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const payable =
    order.status === "pending_payment" &&
    (!order.invoice || order.invoice.status === "unpaid")

  return (
    <div className="flex w-full flex-col gap-4">
      <Link
        href={dashboardPaths.orders}
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "self-start",
        })}
      >
        <HugeiconsIcon
          icon={ArrowLeft02Icon}
          strokeWidth={2}
          data-icon="inline-start"
        />
        Back to orders
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Order #{order.orderId}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="uppercase">{order.status}</Badge>
            <Badge variant="outline">
              {order.kind === "renewal" ? "Renewal" : "New purchase"}
            </Badge>
            {order.invoice ? (
              <Link href={dashboardPaths.invoiceDetail(order.invoice.id)}>
                <Badge variant="outline">
                  Invoice {order.invoice.invoiceNumber}
                </Badge>
              </Link>
            ) : null}
          </div>
          <Separator />
          <Row label="Plan" value={order.plan.name} />
          <Row label="Duration" value={`${order.pricing.durationDays} days`} />
          <Row
            label="Amount"
            value={formatAmount(
              order.invoice?.totalAmount ?? order.pricing.priceUsdCents,
              order.invoice?.currency ?? "USD"
            )}
          />
          <Row label="Created" value={formatDateTime(order.createdAt)} />
          <Row label="Updated" value={formatDateTime(order.updatedAt)} />
          <Row
            label="Invoice status"
            value={order.invoice?.status ?? "No invoice"}
          />
          <Row label="Paid" value={formatDateTime(order.invoice?.paidAt ?? null)} />
        </CardContent>
        <CardFooter>
          {payable ? (
            <Button
              onClick={() =>
                window.location.assign(buildWebCheckoutReviewUrl(order.orderId))
              }
            >
              Pay now
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              This order is not currently payable.
            </span>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
