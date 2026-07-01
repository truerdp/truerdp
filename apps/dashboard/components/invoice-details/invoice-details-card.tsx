import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Invoice03Icon } from "@hugeicons/core-free-icons"

import type { InvoiceSummary } from "@/hooks/use-invoices"
import { buildWebCheckoutReviewUrl } from "@/lib/auth"
import { formatAmount } from "@/lib/format"
import { dashboardPaths } from "@/lib/paths"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { SiteLogo } from "@workspace/ui/components/site-logo"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import {
  formatDateTime,
  formatMethod,
  getInvoiceStatusVariant,
  getInvoiceUrgency,
  isInvoicePayable,
} from "./helpers"

interface InvoiceDetailsCardProps {
  invoice: InvoiceSummary
}

function LabelRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm">{value}</span>
      </div>
      <Separator />
    </>
  )
}

function formatBillingName(
  billingDetails: InvoiceSummary["order"]["billingDetails"]
) {
  if (!billingDetails) {
    return "-"
  }

  const name = `${billingDetails.firstName} ${billingDetails.lastName}`.trim()
  return name || billingDetails.email
}

function formatBillingAddress(
  billingDetails: InvoiceSummary["order"]["billingDetails"]
) {
  if (!billingDetails) {
    return "-"
  }

  return [
    billingDetails.addressLine1,
    billingDetails.addressLine2,
    billingDetails.city,
    billingDetails.state,
    billingDetails.postalCode,
    billingDetails.country,
  ]
    .filter(Boolean)
    .join(", ")
}

function ScreenInvoiceHeader({ invoiceNumber }: { invoiceNumber: string }) {
  return (
    <div className="space-y-1.5 print:hidden">
      <CardTitle className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={Invoice03Icon} strokeWidth={2} />
        Invoice {invoiceNumber}
      </CardTitle>
      <CardDescription>
        Review status, amount, and payment routing for this invoice.
      </CardDescription>
    </div>
  )
}

function PrintInvoiceHeader({
  invoiceNumber,
  status,
}: {
  invoiceNumber: string
  status: InvoiceSummary["status"]
}) {
  return (
    <div className="hidden w-full items-start justify-between border-b pb-6 print:flex">
      <div className="space-y-2">
        <SiteLogo height={40} width={60} />
        <div className="mt-2 space-y-0.5 text-[11px] leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">TrueRDP</p>
          <p>Web: https://truerdp.com</p>
          <p>Email: support@truerdp.com</p>
        </div>
      </div>
      <div className="space-y-1 text-right">
        <h1 className="text-xl font-bold tracking-wider text-foreground uppercase">
          Invoice
        </h1>
        <p className="font-mono text-xs text-muted-foreground">
          {invoiceNumber}
        </p>
        <div className="mt-2">
          <Badge
            variant={getInvoiceStatusVariant(status)}
            className="px-2 py-0.5 text-[10px] font-semibold uppercase"
          >
            Status: {status}
          </Badge>
        </div>
      </div>
    </div>
  )
}

export function InvoiceDetailsCard({ invoice }: InvoiceDetailsCardProps) {
  const payable = isInvoicePayable(invoice)
  const urgency = getInvoiceUrgency(invoice)

  return (
    <Card>
      <CardHeader>
        <ScreenInvoiceHeader invoiceNumber={invoice.invoiceNumber} />
        <PrintInvoiceHeader
          invoiceNumber={invoice.invoiceNumber}
          status={invoice.status}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={getInvoiceStatusVariant(invoice.status)}
            className="uppercase"
          >
            Status: {invoice.status}
          </Badge>
          <Badge variant="outline" className="uppercase">
            Order Status: {invoice.order.status}
          </Badge>
          <Link href={dashboardPaths.orderDetail(invoice.order.id)}>
            <Badge variant="outline">Order #{invoice.order.id}</Badge>
          </Link>
          {invoice.transaction?.id ? (
            <Link
              href={dashboardPaths.transactionDetail(invoice.transaction.id)}
            >
              <Badge variant="outline">
                Transaction #{invoice.transaction.id}
              </Badge>
            </Link>
          ) : null}
          {urgency ? (
            <Badge variant={urgency.variant}>{urgency.label}</Badge>
          ) : null}
        </div>
        <Separator />
        <LabelRow
          label="Customer"
          value={formatBillingName(invoice.order.billingDetails)}
        />
        <LabelRow
          label="Billing address"
          value={formatBillingAddress(invoice.order.billingDetails)}
        />
        <LabelRow label="Plan" value={invoice.plan.name} />
        <LabelRow
          label="Type"
          value={invoice.plan.kind === "renewal" ? "Renewal" : "New purchase"}
        />
        <LabelRow
          label="Duration"
          value={`${invoice.plan.durationDays} days`}
        />
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">Amount</span>
          <span className="text-base font-semibold">
            {formatAmount(invoice.totalAmount, invoice.currency)}
          </span>
        </div>
        <Separator />
        <LabelRow
          label="Method"
          value={formatMethod(invoice.transaction?.method ?? null)}
        />
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            Transaction Reference
          </span>
          <span className="font-mono text-sm">
            {invoice.transaction?.reference || "-"}
          </span>
        </div>
        <Separator />
        <LabelRow label="Created" value={formatDateTime(invoice.createdAt)} />
        <LabelRow label="Expires" value={formatDateTime(invoice.expiresAt)} />
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">Paid</span>
          <span className="text-sm">{formatDateTime(invoice.paidAt)}</span>
        </div>
      </CardContent>
      <CardFooter className="print:hidden">
        {payable ? (
          <Button
            onClick={() =>
              window.location.assign(
                buildWebCheckoutReviewUrl(invoice.order.id)
              )
            }
          >
            Pay now
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">
            This invoice is not currently payable.
          </span>
        )}
      </CardFooter>
    </Card>
  )
}
