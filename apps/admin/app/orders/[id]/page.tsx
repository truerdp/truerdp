"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { AdminUserLink } from "@/components/admin-user-link"
import { formatAmount } from "@/components/invoices-page-parts"
import { useOrder } from "@/hooks/use-orders"
import { adminPaths } from "@/lib/paths"
import { BackButton } from "@workspace/ui/components/back-button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
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

export default function AdminOrderDetailsPage() {
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
          <EmptyDescription>This order could not be loaded.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const userName = `${order.user.firstName} ${order.user.lastName}`.trim()

  return (
    <div className="flex w-full flex-col gap-4">
      <BackButton
        render={<Link href={adminPaths.orders} />}
        className="self-start"
      >
        Back to orders
      </BackButton>

      <Card>
        <CardHeader>
          <CardTitle>Order #{order.id}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="uppercase">{order.status}</Badge>
            <Badge variant="outline">
              {order.kind === "renewal" ? "Renewal" : "New purchase"}
            </Badge>
            {order.invoice ? (
              <Link href={adminPaths.invoiceDetails(order.invoice.id)}>
                <Badge variant="outline">
                  Invoice {order.invoice.invoiceNumber}
                </Badge>
              </Link>
            ) : null}
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Customer</span>
            <AdminUserLink
              userId={order.user.id}
              primary={userName || order.user.email}
              secondary={order.user.email}
            />
          </div>
          <Separator />
          <Row label="Plan" value={order.plan.name} />
          <Row label="Duration" value={`${order.plan.durationDays} days`} />
          <Row
            label="Amount"
            value={formatAmount(
              order.invoice?.totalAmount ?? order.plan.priceUsdCents,
              order.invoice?.currency ?? "USD"
            )}
          />
          <Row label="Created" value={formatDateTime(order.createdAt)} />
          <Row label="Updated" value={formatDateTime(order.updatedAt)} />
          <Row
            label="Invoice status"
            value={order.invoice?.status ?? "No invoice"}
          />
        </CardContent>
      </Card>
    </div>
  )
}
