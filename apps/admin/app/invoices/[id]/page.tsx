"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"

import { AdminUserLink } from "@/components/admin-user-link"
import {
  formatAmount,
  formatMethod,
  getInvoiceStatusBadgeVariant,
  getTransactionStatusBadgeVariant,
} from "@/components/invoices-page-parts"
import { useInvoice } from "@/hooks/use-invoices"
import { adminPaths } from "@/lib/paths"
import { Badge } from "@workspace/ui/components/badge"
import { buttonVariants } from "@workspace/ui/components/button"
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

export default function AdminInvoiceDetailsPage() {
  const { id } = useParams()
  const invoiceId = Number(String(id ?? ""))
  const hasValidInvoiceId = Number.isInteger(invoiceId) && invoiceId > 0
  const {
    data: invoice,
    isLoading,
    isError,
  } = useInvoice(invoiceId, hasValidInvoiceId)

  if (!hasValidInvoiceId) {
    return (
      <Empty className="w-full border">
        <EmptyHeader>
          <EmptyTitle>Missing invoice reference</EmptyTitle>
          <EmptyDescription>Open an invoice from the invoices list.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  if (isLoading) {
    return <Skeleton className="h-80 w-full" />
  }

  if (isError || !invoice) {
    return (
      <Empty className="w-full border">
        <EmptyHeader>
          <EmptyTitle>Invoice not found</EmptyTitle>
          <EmptyDescription>This invoice could not be loaded.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const userName = `${invoice.user.firstName} ${invoice.user.lastName}`.trim()

  return (
    <div className="flex w-full flex-col gap-4">
      <Link
        href={adminPaths.invoices}
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
        Back to invoices
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Invoice {invoice.invoiceNumber}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={getInvoiceStatusBadgeVariant(invoice.status)}
              className="uppercase"
            >
              Status: {invoice.status}
            </Badge>
            <Link href={adminPaths.orderDetails(invoice.order.id)}>
              <Badge variant="outline">Order #{invoice.order.id}</Badge>
            </Link>
            {invoice.transaction.id ? (
              <Link href={adminPaths.transactionDetails(invoice.transaction.id)}>
                <Badge variant="outline">
                  Transaction #{invoice.transaction.id}
                </Badge>
              </Link>
            ) : null}
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Customer</span>
            <AdminUserLink
              userId={invoice.user.id}
              primary={userName || invoice.user.email}
              secondary={invoice.user.email}
            />
          </div>
          <Separator />
          <Row label="Plan" value={invoice.plan.name} />
          <Row label="Duration" value={`${invoice.plan.durationDays} days`} />
          <Row
            label="Amount"
            value={formatAmount(invoice.totalAmount, invoice.currency)}
          />
          <Row label="Method" value={formatMethod(invoice.transaction.method)} />
          <Row
            label="Transaction status"
            value={invoice.transaction.status ?? "none"}
          />
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Payment state</span>
            <Badge
              variant={getTransactionStatusBadgeVariant(
                invoice.transaction.status
              )}
              className="uppercase"
            >
              {invoice.transaction.status ?? "none"}
            </Badge>
          </div>
          <Separator />
          <Row label="Created" value={formatDateTime(invoice.createdAt)} />
          <Row label="Expires" value={formatDateTime(invoice.expiresAt)} />
          <Row label="Paid" value={formatDateTime(invoice.paidAt)} />
        </CardContent>
      </Card>
    </div>
  )
}
