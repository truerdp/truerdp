import { HugeiconsIcon } from "@hugeicons/react"
import { Invoice03Icon } from "@hugeicons/core-free-icons"

import type { InvoiceSummary } from "@/hooks/use-invoices"
import { buildWebCheckoutReviewUrl } from "@/lib/auth"
import { formatAmount } from "@/lib/format"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
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

export function InvoiceDetailsCard({ invoice }: InvoiceDetailsCardProps) {
  const payable = isInvoicePayable(invoice)
  const urgency = getInvoiceUrgency(invoice)

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <HugeiconsIcon icon={Invoice03Icon} strokeWidth={2} />
          Invoice {invoice.invoiceNumber}
        </CardTitle>
        <CardDescription>
          Review status, amount, and payment routing for this invoice.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={getInvoiceStatusVariant(invoice.status)}
            className="uppercase"
          >
            {invoice.status}
          </Badge>
          <Badge variant="outline" className="uppercase">
            {invoice.order.status}
          </Badge>
          <Badge variant="outline">Order #{invoice.order.id}</Badge>
          {urgency ? <Badge variant={urgency.variant}>{urgency.label}</Badge> : null}
        </div>
        <Separator />
        <LabelRow label="Plan" value={invoice.plan.name} />
        <LabelRow
          label="Type"
          value={invoice.plan.kind === "renewal" ? "Renewal" : "New purchase"}
        />
        <LabelRow label="Duration" value={`${invoice.plan.durationDays} days`} />
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">Amount</span>
          <span className="text-base font-semibold">
            {formatAmount(invoice.totalAmount, invoice.currency)}
          </span>
        </div>
        <Separator />
        <LabelRow label="Method" value={formatMethod(invoice.transaction.method)} />
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            Transaction Reference
          </span>
          <span className="font-mono text-sm">
            {invoice.transaction.reference || "-"}
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
      <CardFooter>
        {payable ? (
          <Button
            onClick={() =>
              window.location.assign(buildWebCheckoutReviewUrl(invoice.order.id))
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
